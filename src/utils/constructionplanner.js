const Map = require('./map')

module.exports = class ConstructionPlanner {
  constructor(base) {
    this.base = base
  }

  // build contrsuction plan
  build() {
    this.map = new Map()
    // apply terrain to map
    this.applyTerrain()
    // apply basic buildings (spawn, extractor, containers)
    this.applyBasics()
    // roads around spawn
    this.spawnRoads()
    // walls and ramparts
    this.wallsAndRamparts()
    // other roads to controller, sources, mineral and other rooms
    this.mainRoads()
    // flower pattern with extensions, roads and large structures
    this.flowerBuild()

    //console.log('done')
    //this.map.print()
    this.base.memory.constructionPlan = this.map.export()
    return this
  }

  // retrieve a number of construction jobs
  retrieve(max = MAX_ROOM_CONSTRUCTION_SITES) {
    const _max = max - this.base.myConstructionSites
    if(_max <= 0) {
      return
    }

    const constructionMap = new Map()
    constructionMap.import(this.base.memory.constructionPlan)
    let constructions = constructionMap.structures()

    // filter constructions based on rcl
    constructions = constructions.filter(c => {
      if(c.type === STRUCTURE_WALL || c.type == STRUCTURE_RAMPART) {
        return this.base.controller.level > 2
      }
      return true
    })

    // sort by appropriate structures to build
    constructions.sort((c1, c2) => {
      if(c1.type === c2.type) {
        return 0
      } else if(c1.type === STRUCTURE_WALL || c1.type === STRUCTURE_RAMPART) {
        // push these back
        return 1
      } else if(c1.type === STRUCTURE_EXTENSION) {
        return -1
      }
    })

    // get all constructions that have not been build
    let jobs = []
    for(let c of constructions) {
      const pos = new RoomPosition(c.x, c.y, this.base.name)
      const type = c.type

      const blocked = pos.look().filter(s =>
        (s.type === LOOK_STRUCTURES && s.structure.structureType === type) ||
        (s.type === LOOK_CONSTRUCTION_SITES)
      ).length > 0

      if(!blocked) {
        jobs.push({pos, type})
        if(jobs >= _max)
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
    for(let x = 0; x < 50; x++) {
      for(let y = 0; y < 50; y++) {
        const terrain = Game.map.getTerrainAt(x, y, this.base.name)
        this.map.set(x, y, terrain === 'wall' ? this.map.WALL : this.map.GROUND)
      }
    }
  }

  applyBasics() {
    const spawn = this.base.spawns[0]
    this.map.set(spawn.pos, STRUCTURE_SPAWN)

    const mineral = this.base.mineral
    if(mineral) {
      this.map.set(mineral.pos, STRUCTURE_EXTRACTOR)
    }

    const controller = this.base.controller
    const pathToC = PathFinder.search(spawn.pos, {pos: controller.pos, range: 1}, {
      ignoreCreeps: true,
      ignoreRoads: true,
      roomCallback: (name) => {
        return this.map.costMatrix()
      }
    }).path
    this.map.set(pathToC[pathToC.length - 4], STRUCTURE_CONTAINER)

    const sources = this.base.sources
    for(let s of sources) {
      const pathToS = PathFinder.search(spawn.pos, {pos: s.pos, range: 1}, {
        ignoreCreeps: true,
        ignoreRoads: true,
        roomCallback: (name) => {
          return this.map.costMatrix()
        }
      }).path
      this.map.set(pathToS[pathToS.length - 1], STRUCTURE_CONTAINER)
    }
  }

  spawnRoads() {
    const spawn = this.base.spawns[0].pos
    this.map.set(spawn.x-1, spawn.y, STRUCTURE_ROAD)
    this.map.set(spawn.x+1, spawn.y, STRUCTURE_ROAD)
    this.map.set(spawn.x, spawn.y-1, STRUCTURE_ROAD)
    this.map.set(spawn.x, spawn.y+1, STRUCTURE_ROAD)
  }

  wallsAndRamparts() {
    // fluid fill edges
    for(let i = 0; i < 50; i++) {
      if(this.map.isGround(i, 0))
        this.map.set(i, 0, this.map.FLUID)
      if(this.map.isGround(0, i))
        this.map.set(0, i, this.map.FLUID)
      if(this.map.isGround(49, i))
        this.map.set(49, i, this.map.FLUID)
      if(this.map.isGround(i, 49))
        this.map.set(i, 49, this.map.FLUID)
    }

    // fill two layers
    this.map.fluidfill('box')
    this.map.fluidfill('box')


    // corners walls
    if(this.map.isFluid(2, 2)) this.map.set(2, 2, STRUCTURE_WALL)
    if(this.map.isFluid(47, 2)) this.map.set(47, 2, STRUCTURE_WALL)
    if(this.map.isFluid(2, 47)) this.map.set(2, 47, STRUCTURE_WALL)
    if(this.map.isFluid(47, 47)) this.map.set(47, 47, STRUCTURE_WALL)

    // convert fluid to walls and ramparts
    let gateT, gateL, gateB, gateR, m
    for(let i = 3; i < 48; i++) {
      if(this.map.isFluid(i, 2)) {
        this.map.set(i, 2, STRUCTURE_WALL)
        if(!gateT) gateT = i
      } else if(gateT) {
        m = Math.round((i-1+gateT)/2)
        this.map.set(m, 2, STRUCTURE_RAMPART)
        gateT = 0
      }

      if(this.map.isFluid(2, i)) {
        this.map.set(2, i, STRUCTURE_WALL)
        if(!gateL) gateL = i
      } else if(gateL) {
        m = Math.round((i-1+gateL)/2)
        this.map.set(2, m, STRUCTURE_RAMPART)
        gateL = 0
      }

      if(this.map.isFluid(i, 47)) {
        this.map.set(i, 47, STRUCTURE_WALL)
        if(!gateB) gateB = i
      } else if(gateB) {
        m = Math.round((i-1+gateB)/2)
        this.map.set(m, 47, STRUCTURE_RAMPART)
        gateB = 0
      }

      if(this.map.isFluid(47, i)) {
        this.map.set(47, i, STRUCTURE_WALL)
        if(!gateR) gateR = i
      } else if(gateR) {
        m = Math.round((i-1+gateR)/2)
        this.map.set(47, m, STRUCTURE_RAMPART)
        gateR = 0
      }
    }

    // remove leftover fluid
    this.map.removeFluid()
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

    for(let i = 0; i < targets.length - 1; i++) {
      for(let j = i + 1; j < targets.length; j++) {
        const path = PathFinder.search(targets[i], {pos: targets[j], range: 1}, {
          ignoreCreeps: true,
          ignoreRoads: true,
          roomCallback: (name) => {
            return this.map.costMatrix()
          }
        }).path

        for(let p = 0; p < path.length; p++) {
          if(this.map.get(path[p]) !== STRUCTURE_RAMPART) // ignore this for now
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
      const m = {x: s.x + petal[0], y: s.y + petal[1]}

      // do not build outside room margin
      if(m.x < 5 || m.x > 44 || m.y < 5 || m.y > 44)
        continue

      if(petal[0] === 0 && petal[1] === 4) {
        console.log('here')
      }

      // if the middle is ground, we can build a structure here
      if(this.map.isGround(m)) {
        const struct = structuresToBuild.shift()
        if(struct)
          this.map.set(m, struct)
        else {
          this.map.set(m, STRUCTURE_EXTENSION)
          extensionsLeft--
        }
      }
      // build extensions around center
      const spaces = this.map.adjacentFreeSpaces(m)
      spaces.forEach(s => {
        if(extensionsLeft > 0) {
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
