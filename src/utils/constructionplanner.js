/**
 * Creates a construction plan for a room
 */
const Map = require('./roommap')

module.exports = class ConstructionPlanner {
  constructor(base) {
    this.base = base
  }

  // build contrsuction plan
  build() {
    this.map = new Map()

    this.psearch = (src, dst) => {
      return PathFinder.search(src, { pos: dst, range: 1 }, {
        roomCallback: () => this.map.costmatrix
      }).path
    }

    // get some basic stuff
    this.spos = Game.getObjectById(this.base.spawns[0]).pos
    this.mpos = Game.getObjectById(this.base.mineral).pos
    this.cpos = this.base.controller.pos
    this.srcpos = this.base.sources.map(s => Game.getObjectById(s).pos)

    // apply terrain to map
    this.applyTerrain()
    // apply basic buildings (spawn, extractors, containers, main roads)
    this.applyBasics()
    // walls, ramparts and roads to exits
    this.applyExits()
    // other roads to controller, sources, mineral and other rooms
    //this.mainRoads()
    // flower pattern with extensions, roads and large structures
    //this.flowerBuild()

    return this
  }

  export() {
    return this.map.export()
  }

  import(plan) {
    this.map.import(plan)
  }

  // retrieve a number of construction jobs
  retrieve(max = MAX_ROOM_CONSTRUCTION_SITES) {
    // TODO
    const _max = max - this.base.myConstructionSites
    if (_max <= 0) {
      return
    }

    const constructionMap = new Map()
    constructionMap.import(this.base.memory.constructionPlan)
    let constructions = constructionMap.structures()

    // filter constructions based on rcl
    constructions = constructions.filter(c => {
      if (c.type === STRUCTURE_WALL || c.type == STRUCTURE_RAMPART) {
        return this.base.controller.level > 2
      }
      return true
    })

    // sort by appropriate structures to build
    constructions.sort((c1, c2) => {
      if (c1.type === c2.type) {
        return 0
      } else if (c1.type === STRUCTURE_WALL || c1.type === STRUCTURE_RAMPART) {
        // push these back
        return 1
      } else if (c1.type === STRUCTURE_EXTENSION) {
        return -1
      }
    })

    // get all constructions that have not been build
    let jobs = []
    for (let c of constructions) {
      const pos = new RoomPosition(c.x, c.y, this.base.name)
      const type = c.type

      const blocked = pos.look().filter(s =>
        (s.type === LOOK_STRUCTURES && s.structure.structureType === type) ||
        (s.type === LOOK_CONSTRUCTION_SITES)
      ).length > 0

      if (!blocked) {
        jobs.push({ pos, type })
        if (jobs >= _max)
          break
      }
    }

    // sort by distance to spawn
    const spawn = this.base.spawns[0].pos
    jobs.sort((a, b) => a.pos.getRangeTo(spawn.x, spawn.y) - b.pos.getRangeTo(spawn.x, spawn.y))

    return jobs
  }

  /** CONSTRUCTION PLANNING FUNCTIONS **/

  applyTerrain() {
    // basic terrain
    for (let x = 0; x < 50; x++) {
      for (let y = 0; y < 50; y++) {
        const terrain = Game.map.getTerrainAt(x, y, this.base.name)
        this.map.set(x, y, 0, terrain === 'wall' ? this.map.WALL : this.map.GROUND)
      }
    }
    // existing roads
    this.base.find(FIND_STRUCTURES).filter(
      s => s.structureType === STRUCTURE_ROAD
    ).forEach(r => this.map.set(r.pos.x, r.pos.y, 1, STRUCTURE_ROAD))
  }

  applyBasics() {
    let path, tpos
    // spawn
    this.map.set(this.spos.x, this.spos.y, 1, STRUCTURE_SPAWN)
    // roads around spawn
    this.map.set(this.spos.x - 1, this.spos.y, 1, STRUCTURE_ROAD)
    this.map.set(this.spos.x + 1, this.spos.y, 1, STRUCTURE_ROAD)
    this.map.set(this.spos.x, this.spos.y - 1, 1, STRUCTURE_ROAD)
    this.map.set(this.spos.x, this.spos.y + 1, 1, STRUCTURE_ROAD)
    // mineral extractor
    this.map.set(this.mpos.x, this.mpos.y, 7, STRUCTURE_EXTRACTOR)
    // mineral container and roads
    path = this.psearch(this.spos, this.mpos)
    tpos = path[path.length - 1]
    this.map.set(tpos.x, tpos.y, 7, STRUCTURE_CONTAINER)
    path.forEach(p => this.map.set(p.x, p.y, 7, STRUCTURE_ROAD))
    // controller storage
    path = this.psearch(this.spos, this.cpos)
    tpos = path[path.length - 4]
    this.map.set(tpos.x, tpos.y, 5, STRUCTURE_STORAGE)
    // road to controller
    path = this.psearch(this.spos, this.cpos)
    path.forEach(p => this.map.set(p.x, p.y, 1, STRUCTURE_ROAD))
    // roads to sources and containers
    for (const src of this.srcpos) {
      path = this.psearch(this.spos, src)
      tpos = path[path.length - 1]
      this.map.set(tpos.x, tpos.y, 1, STRUCTURE_CONTAINER)
      path = this.psearch(this.spos, src)
      path.forEach(p => this.map.set(p.x, p.y, 1, STRUCTURE_ROAD))
    }
  }

  applyExits() {
    let path, epos, rpos, wpos

    let rposs = []
    const exits = [FIND_EXIT_TOP, FIND_EXIT_RIGHT, FIND_EXIT_BOTTOM, FIND_EXIT_LEFT]
    exits.forEach(e => {
      // path to nearest exit
      path = this.psearch(this.spos, epos)
      path.forEach(p => {
        if (p.x > 0 && p.x < 49 && p.y > 0 && p.y < 49)
          this.map.set(p.x, p.y, 2, STRUCTURE_ROAD)
        if (p.x === 2 || p.x === 47 || p.y === 2 || p.y === 47) {
          // this is a rampart position
          rposs.push(p)
          rpos = p
        }
      })
    })
    // walls around exits
    // TOP
    let gate = false
    for (const x = 0; x < 50; x++) {
      const closed = this.map.iswall(x, 0)
      // no gate yet but open now
      if (!gate && !closed) {
        gate = true
        this.map.set(x - 1, 1, 2, STRUCTURE_WALL)
        this.map.set(x - 1, 2, 2, STRUCTURE_WALL)
      }
      // if wall is open here, place wall
      if (!closed)
        this.map.set(x, 2, 2, STRUCTURE_WALL)

      if(gate && closed) {
        gate = false
        this.map.set(x, 1, 2, STRUCTURE_WALL)
        this.map.set(x, 2, 2, STRUCTURE_WALL)
      }
    }
    // RIGHT
    for (const y = 0; y < 50; y++) {
      const closed = this.map.iswall(49, y)
      // no gate yet but open now
      if (!gate && !closed) {
        gate = true
        this.map.set(47, y - 1, 2, STRUCTURE_WALL)
        this.map.set(48, y - 1, 2, STRUCTURE_WALL)
      }
      // if wall is open here, place wall
      if (!closed)
        this.map.set(47, 0, 2, STRUCTURE_WALL)

      if(gate && closed) {
        gate = false
        this.map.set(x, 1, 2, STRUCTURE_WALL)
        this.map.set(x, 2, 2, STRUCTURE_WALL)
      }
    }
    // BOTTOM
    for (const x = 0; x < 50; x++) {
      const closed = this.map.iswall(x, 0)
      // no gate yet but open now
      if (!gate && !closed) {
        gate = true
        this.map.set(x - 1, 1, 2, STRUCTURE_WALL)
        this.map.set(x - 1, 2, 2, STRUCTURE_WALL)
      }
      // if wall is open here, place wall
      if (!closed)
        this.map.set(x, 0, 2, STRUCTURE_WALL)

      if(gate && closed) {
        gate = false
        this.map.set(x, 1, 2, STRUCTURE_WALL)
        this.map.set(x, 2, 2, STRUCTURE_WALL)
      }
    }
    // LEFT
    let gate = false
    for (const x = 0; x < 50; x++) {
      const closed = this.map.iswall(x, 0)
      // no gate yet but open now
      if (!gate && !closed) {
        gate = true
        this.map.set(x - 1, 1, 2, STRUCTURE_WALL)
        this.map.set(x - 1, 2, 2, STRUCTURE_WALL)
      }
      // if wall is open here, place wall
      if (!closed)
        this.map.set(x, 0, 2, STRUCTURE_WALL)

      if(gate && closed) {
        gate = false
        this.map.set(x, 1, 2, STRUCTURE_WALL)
        this.map.set(x, 2, 2, STRUCTURE_WALL)
      }
    }
    // place ramparts
    rposs.forEach(r => this.map.set(r.x, r.y, 2, STRUCTURE_RAMPART))
  }

  mainRoads() {
    const s = this.base.spawns[0].pos
    const structs = this.map.structures([STRUCTURE_ROAD, STRUCTURE_RAMPART])

    const exits = [FIND_EXIT_TOP, FIND_EXIT_LEFT, FIND_EXIT_BOTTOM, FIND_EXIT_RIGHT]
    // TODO fix use structures in here
    const exitPos = exits.map(e => s.findClosestByPath(e, {
      ignoreCreeps: true,
      ignoreRoads: true,
      costCallback: (name, cm) => {
        return this.map.costMatrix()
      }
    })).filter(p => p)
    const targets = [
      s,
      this.base.controller.pos,
      this.base.mineral.pos,
    ].concat(...this.base.sources.map(s => s.pos)).concat(...exitPos)

    for (let i = 0; i < targets.length - 1; i++) {
      for (let j = i + 1; j < targets.length; j++) {
        const path = PathFinder.search(targets[i], { pos: targets[j], range: 1 }, {
          ignoreCreeps: true,
          ignoreRoads: true,
          roomCallback: (name) => {
            return this.map.costMatrix()
          }
        }).path

        for (let p = 0; p < path.length; p++) {
          if (this.map.get(path[p]) !== STRUCTURE_RAMPART) // ignore this for now
            this.map.set(path[p], STRUCTURE_ROAD)
        }
      }
    }

  }

  flowerBuild() {
    const s = this.base.spawns[0].pos
    let extensionsLeft = CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][8]
    let structuresToBuild = [
      STRUCTURE_TOWER, STRUCTURE_TOWER, STRUCTURE_TOWER, STRUCTURE_STORAGE
    ]
    // TODO make algorithm for petals
    let petals = [
      [-2, 2], [2, 2], [2, -2], [-2, -2],
      [-4, 4], [0, 4], [4, 4], [4, 0],
      [4, -4], [0, -4], [-4, -4], [-4, 0],
      [-6, 6], [-2, 6], [2, 6], [6, 6],
      [6, 2], [6, -2], [6, -6], [2, -6],
      [-2, -6], [-6, -6], [-6, -2], [-6, 2],
      [-8, 8], [-4, 8], [0, 8], [4, 8],
      [8, 8], [8, 4], [8, 0], [8, -4],
      [8, -8], [4, -8], [0, -8], [-4, -8],
      [-8, -8], [-8, -4], [-8, 0], [-8, 4]
    ]

    // iterate over all petals until no buildings are left
    for (let i = 0; i < petals.length && extensionsLeft > 0; i++) {
      const petal = petals[i]
      const m = { x: s.x + petal[0], y: s.y + petal[1] }

      // do not build outside room margin
      if (m.x < 5 || m.x > 44 || m.y < 5 || m.y > 44)
        continue

      if (petal[0] === 0 && petal[1] === 4) {
        console.log('here')
      }

      // if the middle is ground, we can build a structure here
      if (this.map.isGround(m)) {
        const struct = structuresToBuild.shift()
        if (struct)
          this.map.set(m, struct)
        else {
          this.map.set(m, STRUCTURE_EXTENSION)
          extensionsLeft--
        }
      }
      // build extensions around center
      const spaces = this.map.adjacentFreeSpaces(m)
      spaces.forEach(s => {
        if (extensionsLeft > 0) {
          this.map.set(s, STRUCTURE_EXTENSION)
          extensionsLeft--
        }
      })

      // build roads around extensions
      spaces.forEach(s => this.map.adjacentFreeSpaces(s).forEach(x => {
        this.map.set(x, STRUCTURE_ROAD)
      }))
    }
  }
}
