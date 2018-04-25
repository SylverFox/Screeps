const towermaster = require('./towermaster')
const sSpawning = require('./strategies/spawning')
const Creeps = require('./creeps/creeps')
const ConstructionPlanner = require('./utils/constructionplanner')

module.exports = class Base extends Room {
  constructor(room) {
    super(room.name)
    Object.assign(this, room)
  }

  run() {
    // handle first spawn point
    if(!this.spawns.length) {
      if(!this.memory.firstSpawn) {
        return
      }
      const pos = new RoomPosition(this.memory.firstSpawn.x, this.memory.firstSpawn.y, this.memory.firstSpawn.roomName)
      const result = this.createConstructionSite(pos, STRUCTURE_SPAWN)
      if(result !== OK && result !== ERR_RCL_NOT_ENOUGH) {
        console.log('first spawn creation failed', result)
      }
      return
    }

    // run al creepjobs
    this.creeps.forEach(creep => {
      try {
        creep.performJob()
      } catch(err) {
        console.log(err.stack)
      }
    })
    // work towers
    towermaster.work(this)

    // run outposts
    this.outposts.map(o => Game.rooms[o]).filter(o => o).forEach(o => {
      try {
        o.outpost.run(this)
      } catch(err) {
        console.log(err, err.stack)
      }
    })


    // handle invasions
    if(this.hostileCreeps.length) {
      this.defcon = DEFCON_4
    } else {
      this.defcon = DEFCON_5
    }
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

    if (Game.time % CREEP_SPAWN_INTERVAL === 0) this._handleCreepSpawning()
    if (Game.time % EXPANSION_INTERVAL === 0) this._handleExpansion()

    // draw stuff
    this.sources.filter(s => s.container).forEach(
      s => this.visual.text(s.container.store[RESOURCE_ENERGY], s.container.pos)
    )
    if(this.memory.nextCreeps && this.memory.nextCreeps.length) {
      this.visual.text('next creeps: '+JSON.stringify(this.memory.nextCreeps), 10, 10, {align: 'left'})
    }

    // draw visuals
    this.visual.text('test text', 0, 0, {color: 'red', font: 0.8})
    this.visual.text('test text', 0, 10, {color: 'blue', font: 1.0})
    this.visual.text('test text', 0, 20, {color: 'green', font: 1.2})
  }

  _handleCreepSpawning() {
    const firstAvailableSpawn = this.spawns.find(s => !s.spawning)
    if(!firstAvailableSpawn)
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

  _handleExpansion() {
    const constructionplanner = new ConstructionPlanner(this)

    if (!this.memory.constructionPlan) {
       constructionplanner.build()
    }

    const constructionJobs = constructionplanner.retrieve()

    if (constructionJobs && constructionJobs.length) {
      for (let job of constructionJobs) {
        const result = job.pos.createConstructionSite(job.type)
        if (result === OK)
          console.log('new construction job at (', job.pos.x, ',', job.pos.y, ') of type ', job.type)
        else if(result === ERR_RCL_NOT_ENOUGH || result === ERR_FULL) {
          // do nothing now
        } else
          console.log('new construction job', job.type, 'failed at (', job.pos.x, ',', job.pos.y, '), reason: ' + result)
        }
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

  get spawns() {
    if (!this._spawns) {
      this._spawns = this.find(FIND_MY_SPAWNS)
    }
    return this._spawns
  }

  get creeps() {
    if (!this._creeps) {
      this._creeps = Object.keys(Game.creeps).map(c => Game.creeps[c]).filter(c =>
        c.memory.home === this.name && !c.spawning && c.memory.role
      ).map(c => Creeps.from(c))
    }
    return this._creeps
  }

  get towers() {
    if (!this._towers) {
      this._towers = this.myStructures.filter(s =>
        s.structureType === STRUCTURE_TOWER
      )
    }
    return this._towers
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
    if(!this._damagedStructures)
      this._damagedStructures = this.structures.filter(s => {
        if(s.structureType === STRUCTURE_WALL)
          return s.hits < s.hitsMax * 0.0001
        else if(s.structureType === STRUCTURE_RAMPART)
          return s.hits < s.hitsMax * 0.1
        else
          return s.hits < s.hitsMax * 0.75
      }).sort((a,b) => a.hits/a.hitsMax - b.hits/b.hitsMax)
    return this._damagedStructures
  }

  get baseRepairableStructures() {
    if(!this._baseRepairableStructures) {
      this._baseRepairableStructures = this.rooms.map(r => r.structures).reduce(
        (a, b) => a.concat(b), []
      ).filter(
        s => s.hits < s.hitsMax
      ).sort((a,b) => a.hits/a.hitsMax - b.hits/b.hitsMax)
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
    if(!this._repairableDefenses) {
      this._repairableDefenses = this.structures.filter(
        s => [STRUCTURE_WALL, STRUCTURE_RAMPART].includes(s.structureType) && s.hits < s.hitsMax
      )
      this._repairableDefenses.sort((a, b) => a.hits/a.hitsMax - b.hits/b.hitsMax)
    }
    return this._repairableDefenses
  }

  get income() {
    if(!this._income) {
      let income = this.creeps.filter(c =>
        c.memory.role === Creeps.HOME_MINER
      ).length * 5 * HARVEST_POWER

      // add additional income for buffered storage
      if(this.storage)
        income += this.storage.store[RESOURCE_ENERGY] / 10000

      this._income = income
    }
    return this._income
  }

  get expense() {
    if(!this._expense) {
      if(this.creeps.length) {
        this._expense = this.creeps.filter(c => c.memory.role === Creeps.HOME_MECHANIC).map(
          c => c.body
        ).reduce((a,b) => a.concat(b), []).filter(bp => bp.type === WORK).length

        this._expense = this.creeps.filter(c => c.memory.role === Creeps.HOME_UPGRADER).map(
          c => c.body
        ).reduce((a, b) => a.concat(b), []).filter(bp => bp.type === WORK).length

        this._expense += this.creeps.map(c => c.body).reduce((a,b) => a.concat(b), []).map(
          p => BODYPART_COST[p.type]
        ).reduce((a,b) => a+b) / CREEP_LIFE_TIME

        this._expense += this.memory.towersIdle ? 0 : this.towers.length * TOWER_ENERGY_COST
      } else {
        this._expense = 0
      }
    }
    return this._expense
  }

  get rooms() {
    if(!this._rooms) {
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
    if(!this._otherRooms) {
      this._otherRooms = this.rooms.filter(r => r.name !== this.name)
    }
    return this._otherRooms
  }

  get roomsToClaim() {
    if(!this._roomsToClaim) {
      this._roomsToClaim = this.outposts.filter(
        o => !Game.rooms[o] ||
        !Game.rooms[o].controller.reservation ||
        Game.rooms[o].controller.reservation.ticksToEnd < 0.8 * CONTROLLER_RESERVE_MAX
      )
    }
    return this._roomsToClaim
  }

  get baseSources() {
    if(!this._baseSources)
      this._baseSources = this.rooms.map(r => r.sources).reduce((a, b) => a.concat(b), [])
    return this._baseSources
  }

  get outpostSources() {
    if(!this._outpostSources)
      this._outpostSources = this.outposts.map(o => Game.rooms[o]).filter(r => r).map(
        r => r.sources
      ).reduce((a, b) => a.concat(b), [])
    return this._outpostSources
  }

  get hostileCreeps() {
    return this.rooms.map(r => r.find(FIND_HOSTILE_CREEPS)).reduce((a,b) => a.concat(b), [])
  }

  // spawns, extensions, towers
  get basePrimaryStorages() {
    if(!this._basePrimaryStorages) {
      this._basePrimaryStorages = this.primaryStorages
    }
    return this._basePrimaryStorages
  }

  // storage and containers not next to sources and minerals
  get baseSecondaryStorages() {
    if(!this._baseSecondaryStorages) {
      this._baseSecondaryStorages = this.secondaryStorages
    }
    return this._baseSecondaryStorages
  }

  // active provider containers,
  get baseTertiaryStorages() {
    if(!this._baseTertiaryStorages) {
      this._baseTertiaryStorages = this.baseSources.map(s => s.container).filter(s => s)
    }
    return this._baseTertiaryStorages
  }

  get baseDrops() {
    if(!this._baseDrops) {
      this._baseDrops = this.rooms.map(r => r.drops).reduce(
        (a, b) => a.concat(b), []
      ).filter(d => d)
    }
    return this._baseDrops
  }

  get outposts() {
    if(!this._outposts) {
      if(!this.memory.outposts)
        this.memory.outposts = []
      this._outposts = this.memory.outposts
    }
    return this._outposts
  }

  get defcon() {
    if(!this._defcon)
      if(!this.memory.defcon)
        this.memory.defcon = DEFCON_5
      this._defcon = this.memory.defcon
    return this._defcon
  }

  set defcon(defcon) {
    this._defcon = defcon
    this.memory.defcon = defcon
  }
}
