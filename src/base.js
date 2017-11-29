const towermaster = require('./towermaster')
const sSpawning = require('./strategy.spawning')
const sExpansion = require('./strategy.expansion')
const Creeps = require('./creeps')

module.exports = class Base extends Room {
  constructor(room) {
    super(room.name)
    Object.assign(this, room)
  }

  run() {
    // handle first spawn point
    if(!this.spawns.length && this.memory.firstSpawn) {
      const pos = new RoomPosition(this.memory.firstSpawn.x, this.memory.firstSpawn.y, this.memory.firstSpawn.roomName)
      const result = this.createConstructionSite(pos, STRUCTURE_SPAWN)
      if(result !== OK && result !== ERR_RCL_NOT_ENOUGH) {
        console.log('first spawn creation failed',result)
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

    /*
    // handle invasions
    for (let i in this.memory.invaders) {
      const invader = this.memory.invaders[i]
      if ((Game.time - invader.lastseen) > 100)
        delete this.memory.invaders[i]
    }
    if(this.hostileCreeps.length) {
      // TODO
    }
    */

    if (Game.time % CREEP_SPAWN_INTERVAL === 0) this.handleCreepSpawning()
    if (Game.time % EXPANSION_INTERVAL === 0) this.handleExpansion()
    //console.log(this.income, this.expense)
  }

  handleCreepSpawning() {
    const newCreep = sSpawning.run(this)

    if (newCreep === sSpawning.ERR_NEED_MORE_ENERGY) {
      this.savingEnergy = true
    } else if (newCreep === sSpawning.ERR_NO_CREEP_TO_SPAWN) {
      this.savingEnergy = false
    } else if (newCreep && newCreep.body) {
      const firstAvailableSpawn = this.spawns.find(s => !s.spawning)
      if (firstAvailableSpawn) {
        this.savingEnergy = false
        const name = this.name + Game.time
        newCreep.memory.home = this.name
        const result = firstAvailableSpawn.spawnCreep(newCreep.body, name, {
          memory: newCreep.memory
        })
      }
    }
  }

  handleExpansion() {
    const constructionJobs = sExpansion.run(this)
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
    return this.creeps.filter(c => c.role === creepRole).map(c =>
      c.target
    ).filter(c => c)
  }

  getCreepTargetsByType(creepType) {
    return this.creeps.filter(c => c instanceof creepType).map(c =>
      c.target
    ).filter(c => c)
  }

  getCreepJobsByType(creepType) {
    return this.creeps.filter(c => c instanceof creepType).map(c =>
      c.job
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
      this._damagedStructures = this.rooms.map(r => r.structures).reduce(
        (a, b) => a.concat(b), []
      ).filter(s => {
        if(s.structureType === STRUCTURE_WALL)
          return s.hits < s.hitsMax * 0.0001
        else if(s.structureType === STRUCTURE_RAMPART)
          return s.hits < s.hitsMax * 0.1
        else
          return s.hits < s.hitsMax * 0.9
      }).sort((a,b) => a.hits/a.hitsMax - b.hits/b.hitsMax)
    return this._damagedStructures
  }

  get myConstructionSites() {
    if (!this._myConstructionSites) {
      this._myConstructionSites = this.rooms.map(r =>
        r.find(FIND_MY_CONSTRUCTION_SITES)
      ).reduce((a, b) => a.concat(b), [])
    }
    return this._myConstructionSites
  }

  get income() {
    if(!this._income) {
      let income = this.creeps.filter(c =>
        c.memory.role === 'miner'
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
      this._expense = this.creeps.filter(c => c.memory.role === 'mechanic').map(c => c.body)
        .reduce((a,b) => a.concat(b), []).filter(bp => bp.type === WORK).length

      this._expense += this.creeps.map(c => c.body).reduce((a,b) => a.concat(b), [])
        .map(p => BODYPART_COST[p.type]).reduce((a,b) => a+b) / CREEP_LIFE_TIME

      this._expense += this.memory.towersIdle ? 0 : this.towers.length * TOWER_ENERGY_COST
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

  get roomsToScout() {
    if(!this._roomsToScout) {
      this._roomsToScout = [
        this.top, this.right, this.bottom, this.left,
        this.topleft, this.topright, this.bottomright, this.bottomleft
      ].filter(r => r && !Game.rooms[r])
    }
    return this._roomsToScout
  }

  get roomsToClaim() {
    if(!this._roomsToClaim) {
      this._roomsToClaim = [
        this.top, this.right, this.bottom, this.left
      ].map(r => Game.rooms[r]).filter(r => r && r.controller).filter(r => {
          const res = r.controller.reservation
          return res ? (
            res.username === USERNAME && res.ticksToEnd < (0.8 * CONTROLLER_RESERVE_MAX)
          ) : true
      })
    }
    return this._roomsToClaim
  }

  get baseSources() {
    if(!this._baseSources)
      this._baseSources = this.rooms.map(r => r.sources).reduce((a, b) => a.concat(b), [])
    return this._baseSources
  }

  get hostileCreeps() {
    return this.rooms.map(r => r.find(FIND_HOSTILE_CREEPS)).reduce((a,b) => a.concat(b), [])
  }

  // spawns, extensions, towers
  get primaryStorages() {
    if(!this._primaryStorages) {
      this._primaryStorages = this.myStructures.filter(s =>
        [STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_TOWER].includes(s.structureType)
      )
    }
    return this._primaryStorages
  }

  // storage and containers not next to sources and minerals
  get secondaryStorages() {
    if(!this._secondaryStorages) {
      this._secondaryStorages = this.structures.filter(s =>
        s.structureType === STRUCTURE_CONTAINER &&
        !this.tertiaryStorages.includes(s)
      )
      //if(this.storage)
      //  this._secondaryStorages.push(this.storage)
    }
    return this._secondaryStorages
  }

  // active provider containers,
  get tertiaryStorages() {
    if(!this._tertiaryStorages) {
      this._tertiaryStorages = this.baseSources.map(s => s.container).filter(s => s)
    }
    return this._tertiaryStorages
  }

  get drops() {
    if(!this._drops) {
      this._drops = this.find(FIND_DROPPED_RESOURCES)
    }
    return this._drops
  }

  get storeTargets() {
    if(!this._storeTargets) {
      const primary = this.primaryStorages.filter(s => s.freeSpace)
      const secondary = this.secondaryStorages.filter(s => s.freeSpace)
      if(primary.length)
        this._storeTargets = primary
      else if(secondary)
        this._storeTargets = secondary
    }
    return this._storeTargets
  }
}
