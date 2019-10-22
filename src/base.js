const towermaster = require('./towermaster')
const sSpawning = require('./strategies/spawning')
const Creeps = require('./creeps/creeps')
const ConstructionPlanner = require('./utils/constructionplanner')

module.exports = class Base extends Room {
  constructor(room) {
    super(room.name)
    Object.assign(this, room)

    // load from memory
    const blob = this.memory
    this.spawnqueue = blob.spawnqueue || []
    this.constructionqueue = blob.constructionqueue || []
    this.outposts = blob.outposts || []
    this.towers = blob.towers || []
    this.defcon = blob.defcon || DEFCON_5
    this.lastUpdate = blob.lastupdate || 0
    this.lastExpansion = blob.lastexpansion || 0
    this.lastCreepSpawning = blob.lastcreepspawning || 0
    this.spawns = blob.spawns || []

    this.creeps = Object.keys(Game.creeps).map(c => Game.creeps[c]).filter(c =>
      c.memory.home === this.name && !c.spawning && c.memory.role
    ).map(c => Creeps.from(c))
  }

  run() {
    this.cpustart = Game.cpu.getUsed()
    // handle first spawn point
    // TODO
    /*
    if (!this.spawns.length) {
      if (!this.memory.firstSpawn) {
        return
      }
      const pos = new RoomPosition(this.memory.firstSpawn.x, this.memory.firstSpawn.y, this.memory.firstSpawn.roomName)
      const result = this.createConstructionSite(pos, STRUCTURE_SPAWN)
      if (result !== OK && result !== ERR_RCL_NOT_ENOUGH) {
        console.log('first spawn creation failed', result)
      }
      return
    }
    */

    // work creeps
    this.creeps.forEach(creep => {
      try {
        creep.performJob()
      } catch (err) {
        console.log(err.stack)
      }
    })

    // work towers
    towermaster.work(this)

    // creep spawning
    if (this.spawnqueue.length) {
      const nextToSpawn = this.spawnqueue[0]
      const haveEnergy = this.energyAvailable >= nextToSpawn.nrg
      const spawn = this.spawns.map(s => Game.getObjectById(s)).find(s => !s.spawning)
      const spawnAvailable = !!spawn
      if (haveEnergy && spawnAvailable) {
        // all set, spawn creep
        const name = this.name + Game.time
        const result = spawn.spawnCreep(nextToSpawn.body, name, {
          memory: nextToSpawn.memory
        })
        if (result === OK) {
          this.spawnqueue.shift()
        }
        else {
          console.warn('Unable to spawn creep, reason: ' + result)
        }
      }
    } else if (!(this.creeps.length || this.spawns.map(s => Game.getObjectById(s)).filter(s => s.spawning).length)) {
      // nothing in the queue, nothing is spawning and no creeps left
      const sourceSpace = this.sources.map(s => Game.getObjectById(s).freeSpaces).reduce((a, b) => a + b)
      for (let i = 0; i < sourceSpace; i++) {
        this.addToSpawnqueue({
          body: [WORK, MOVE, CARRY],
          nrg: 200,
          memory: {
            role: 'simpleworker',
            home: this.name
          }
        })
      }
    }

    // build constructions
    if (this.constructionqueue.length) {
      /*
      if (constructionJobs && constructionJobs.length) {
        for (let job of constructionJobs) {
          const result = job.pos.createConstructionSite(job.type)
          if (result === OK)
            console.log('new construction job at (', job.pos.x, ',', job.pos.y, ') of type ', job.type)
          else if (result === ERR_RCL_NOT_ENOUGH || result === ERR_FULL) {
            // do nothing now
          } else
            console.log('new construction job', job.type, 'failed at (', job.pos.x, ',', job.pos.y, '), reason: ' + result)
        }
      }
      */
    }

    // run outposts
    // TODO
    /*
    this.outposts.map(o => Game.rooms[o]).filter(o => o).forEach(o => {
      try {
        o.outpost.run(this)
      } catch(err) {
        console.log(err, err.stack)
      }
    })
    */

    // TODO
    // handle invasions
    /*
    if(this.hostileCreeps.length) {
      this.defcon = DEFCON_4
    } else {
      this.defcon = DEFCON_5
    }
    */
    /*
    for (let i in this.memory.invaders) {
      const invader = this.memory.invaders[i]
      if ((Game.time - invader.lastseen) > 100)
        delete this.memory.invaders[i]
    }
    if(this.hostileCreeps.length) {
      // TODO
    }
    */

    // update base info
    if (Game.time - this.lastUpdate > BASE_UPDATE_INTERVAL) {
      this.update()
    }

    // update spawning queue
    if (Game.time - this.lastCreepSpawning > BASE_CREEP_SPAWN_INTERVAL) {
      this.spawning()
    }

    // update expansion
    if (Game.time - this.lastExpansion > BASE_EXPANSION_INTERVAL) {
      this.expansion()
    }

    //draw visuals
    if (DRAW_VISUALS) {
      this.drawvisuals()
    }

    const constructionplanner = new ConstructionPlanner(this)
    const plan = constructionplanner.build().export()
    for (const c of plan) {
      this.visual.text(c[3], c[0], c[1], { color: 'red' })
    }

  }

  update() {
    this.memory.towers = this.myStructures.filter(s => s.structureType === STRUCTURE_TOWER).map(s => s.id)
    this.memory.spawns = this.myStructures.filter(s => s.structureType === STRUCTURE_SPAWN).map(s => s.id)
    this.memory.lastupdate = Game.time
  }

  expansion() {
    const constructionplanner = new ConstructionPlanner(this)
    return
    // if no constructionplan, build a new one
    if (!this.memory.constructionplan) {
      this.memory.constructionplan = constructionplanner.build().export()
    } else {
      constructionplanner.import(this.memory.constructionplan)
    }

    this.memory.constructionqueue = constructionplanner.retrieve()
  }

  spawning() {
    //TODO: handle spawnqueue building
  }

  clean() {
    this.memory = null
    this.update()
    this.expansion()
    this.spawning()
  }

  drawvisuals() {
    const TEXT_LEFT = { color: 'white', font: 1.0, align: 'left' }
    const TEXT_RIGHT = { color: 'white', font: 1.0, align: 'right' }
    const OFFSET = 12

    this.visual.text('energy available', 0, 1, TEXT_LEFT)
    this.visual.text(this.energyAvailable, 0 + OFFSET, 1, TEXT_RIGHT)
    this.visual.text('energy cap', 0, 2, TEXT_LEFT)
    this.visual.text(this.energyCapacityAvailable, 0 + OFFSET, 2, TEXT_RIGHT)
    this.visual.text('spawn queue size', 0, 3, TEXT_LEFT)
    this.visual.text(this.spawnqueue.length, 0 + OFFSET, 3, TEXT_RIGHT)
    this.visual.text('cpu used', 0, 4, TEXT_LEFT)
    this.visual.text(Math.round((Game.cpu.getUsed()-this.cpustart) * 100) / 100, 0 + OFFSET, 4, TEXT_RIGHT)
    this.sources.filter(s => s.container).forEach(
      s => this.visual.text(s.container.store[RESOURCE_ENERGY], s.container.pos, this.DRAW_TEXT_OPTS)
    )
  }

  _handleCreepSpawning() {
    const firstAvailableSpawn = this.spawns.find(s => !s.spawning)
    if (!firstAvailableSpawn)
      return

    const newCreep = sSpawning.run(this)

    this.savingEnergy = false
    if (newCreep === sSpawning.ERR_NEED_MORE_ENERGY && this.energyAvailable < this.energyCapacityAvailable) {
      this.savingEnergy = true
    } else if (newCreep && newCreep.body) {
      const name = newCreep.memory.role + this.name + Game.time
      newCreep.memory.home = this.name
      const result = firstAvailableSpawn.spawnCreep(newCreep.body, name, {
        memory: newCreep.memory
      })
    }
  }

  getCreepTargetsByRole(creepRole) {
    return this.creeps.filter(c => c.role === creepRole).map(
      c => c.target
    ).filter(c => c)
  }

  getCreepJobsByRole(creepRole) {
    return this.creeps.filter(c => c.role === creepRole).map(
      c => c.job
    ).filter(c => c)
  }


  get savingEnergy() {
    if (!this._savingEnergy) {
      this._savingEnergy = this.memory.savingEnergy
    }
    return this._savingEnergy
  }

  set savingEnergy(saving) {
    this.memory.savingEnergy = saving
    this._savingEnergy = saving
  }

  get damagedStructures() {
    if (!this._damagedStructures)
      this._damagedStructures = this.structures.filter(s => {
        if (s.structureType === STRUCTURE_WALL)
          return s.hits < s.hitsMax * 0.0001
        else if (s.structureType === STRUCTURE_RAMPART)
          return s.hits < s.hitsMax * 0.1
        else
          return s.hits < s.hitsMax * 0.75
      }).sort((a, b) => a.hits / a.hitsMax - b.hits / b.hitsMax)
    return this._damagedStructures
  }

  get baseRepairableStructures() {
    if (!this._baseRepairableStructures) {
      this._baseRepairableStructures = this.rooms.map(r => r.structures).reduce(
        (a, b) => a.concat(b), []
      ).filter(
        s => s.hits < s.hitsMax
      ).sort((a, b) => a.hits / a.hitsMax - b.hits / b.hitsMax)
    }
    return this._baseRepairableStructures
  }

  get baseConstructionSites() {
    if (!this._baseConstructionSites) {
      this._baseConstructionSites = this.rooms.map(r =>
        r.myConstructionSites
      ).reduce((a, b) => a.concat(b), [])
    }
    return this._baseConstructionSites
  }

  get repairableDefenses() {
    if (!this._repairableDefenses) {
      this._repairableDefenses = this.structures.filter(
        s => [STRUCTURE_WALL, STRUCTURE_RAMPART].includes(s.structureType) && s.hits < s.hitsMax
      )
      this._repairableDefenses.sort((a, b) => a.hits / a.hitsMax - b.hits / b.hitsMax)
    }
    return this._repairableDefenses
  }

  get income() {
    if (!this._income) {
      let income = this.creeps.filter(c =>
        c.memory.role === Creeps.HOME_MINER
      ).length * 5 * HARVEST_POWER

      // add additional income for buffered storage
      if (this.storage)
        income += this.storage.store[RESOURCE_ENERGY] / 10000

      this._income = income
    }
    return this._income
  }

  get expense() {
    if (!this._expense) {
      if (this.creeps.length) {
        this._expense = this.creeps.filter(c => c.memory.role === Creeps.HOME_MECHANIC).map(
          c => c.body
        ).reduce((a, b) => a.concat(b), []).filter(bp => bp.type === WORK).length

        this._expense = this.creeps.filter(c => c.memory.role === Creeps.HOME_UPGRADER).map(
          c => c.body
        ).reduce((a, b) => a.concat(b), []).filter(bp => bp.type === WORK).length

        this._expense += this.creeps.map(c => c.body).reduce((a, b) => a.concat(b), []).map(
          p => BODYPART_COST[p.type]
        ).reduce((a, b) => a + b) / CREEP_LIFE_TIME

        this._expense += this.memory.towersIdle ? 0 : this.towers.length * TOWER_ENERGY_COST
      } else {
        this._expense = 0
      }
    }
    return this._expense
  }

  get rooms() {
    if (!this._rooms) {
      this._rooms = [
        this.topleft, this.top, this.topright,
        this.left, this.name, this.right,
        this.bottomleft, this.bottom, this.bottomright
      ].filter(r => r).map(r => Game.rooms[r]).filter(r =>
        r && [ROOM_TYPE_FARM, ROOM_TYPE_MY_OUTPOST, ROOM_TYPE_MY_BASE].includes(r.roomType)
      )
    }
    return this._rooms
  }

  get otherRooms() {
    if (!this._otherRooms) {
      this._otherRooms = this.rooms.filter(r => r.name !== this.name)
    }
    return this._otherRooms
  }

  get roomsToClaim() {
    if (!this._roomsToClaim) {
      this._roomsToClaim = this.outposts.filter(
        o => !Game.rooms[o] ||
          !Game.rooms[o].controller.reservation ||
          Game.rooms[o].controller.reservation.ticksToEnd < 0.8 * CONTROLLER_RESERVE_MAX
      )
    }
    return this._roomsToClaim
  }

  get baseSources() {
    if (!this._baseSources)
      this._baseSources = this.rooms.map(r => r.sources).reduce((a, b) => a.concat(b), [])
    return this._baseSources
  }

  get outpostSources() {
    if (!this._outpostSources)
      this._outpostSources = this.outposts.map(o => Game.rooms[o]).filter(r => r).map(
        r => r.sources
      ).reduce((a, b) => a.concat(b), [])
    return this._outpostSources
  }

  get hostileCreeps() {
    return this.rooms.map(r => r.find(FIND_HOSTILE_CREEPS)).reduce((a, b) => a.concat(b), [])
  }

  // spawns, extensions, towers
  get basePrimaryStorages() {
    if (!this._basePrimaryStorages) {
      this._basePrimaryStorages = this.primaryStorages
    }
    return this._basePrimaryStorages
  }

  // storage and containers not next to sources and minerals
  get baseSecondaryStorages() {
    if (!this._baseSecondaryStorages) {
      this._baseSecondaryStorages = this.secondaryStorages
    }
    return this._baseSecondaryStorages
  }

  // active provider containers,
  get baseTertiaryStorages() {
    if (!this._baseTertiaryStorages) {
      this._baseTertiaryStorages = this.baseSources.map(s => s.container).filter(s => s)
    }
    return this._baseTertiaryStorages
  }

  get baseDrops() {
    if (!this._baseDrops) {
      this._baseDrops = this.rooms.map(r => r.drops).reduce(
        (a, b) => a.concat(b), []
      ).filter(d => d)
    }
    return this._baseDrops
  }

  setDefcon(defcon) {
    this.defcon = defcon
    this.memory.defcon = defcon
  }

  addToSpawnqueue(creep) {
    this.spawnqueue.push(creep)
    this.memory.spawnqueue = this.spawnqueue
  }
}
