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

    // handle invasions
    for (let i in this.memory.invaders) {
      const invader = this.memory.invaders[i]
      if ((Game.time - invader.lastseen) > 100)
        delete this.memory.invaders[i]
    }
    if(this.hostileCreeps.length) {
      // TODO
    }

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
        const result = firstAvailableSpawn.createCreep(newCreep.body, name, newCreep.memory)
        if (result !== name)
          console.log('could not spawn creep, reason: ', result, JSON.stringify(newCreep))
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

  creepTargetsByType(creepType) {
    // TODO cache this?
    return this.creeps.filter(c => c instanceof creepType).map(c => c.target)
  }

  creepJobsByType(creepType) {
    // TODO cache this?
    return this.creeps.filter(c => c instanceof creepType).map(c => c.job)
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

  get structures() {
    if (!this._structures) {
      this._structures = this.find(FIND_STRUCTURES)
    }
    return this._structures
  }

  get myStructures() {
    if (!this._myStructures) {
      this._myStructures = this.structures.filter(s => s.my)
    }
    return this._myStructures
  }

  get damagedStructures() {
    if(!this._damagedStructures)
      this._damagedStructures = this.structures.filter(s => {
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
      const nearSites = this.nearRooms.map(r => r.find(FIND_MY_CONSTRUCTION_SITES)).reduce((a, b) => a.concat(b), [])
      this._myConstructionSites = this.find(FIND_MY_CONSTRUCTION_SITES).concat(nearSites)
    }
    return this._myConstructionSites
  }

  get income() {
    if(!this._income) {
      this._income = this.creeps.filter(c => c.memory.role === 'miner')
        .map(c => c.body).reduce((a,b) => a.concat(b), []).filter(bp => bp.type === WORK).length * HARVEST_POWER
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

  get adjacentRooms() {
    if (!this._adjacentRooms) {
      const exits = Game.map.describeExits(this.name)
      this._adjacentRooms = Object.keys(exits).map(e => {
        return {
          room: exits[e],
          type: Game.rooms[exits[e]] ? Game.rooms[exits[e]].roomType : ROOM_TYPE_FOGGED
        }
      })
    }
    return this._adjacentRooms
  }

  get nearRooms() {
    if(!this._nearRooms) {
      const adjc = this.adjacentRooms.map(r => Game.rooms[r.room]).filter(r => r)
      const diag = [this.topleft, this.topright, this.bottomleft, this.bottomright].map(r => Game.rooms[r]).filter(r => r)
      this._nearRooms = adjc.concat(diag)
    }
    return this._nearRooms
  }

  get roomsToScout() {
    if(!this._roomsToScout) {
      const adjcFogged = this.adjacentRooms.filter(ar => ar.type === ROOM_TYPE_FOGGED)
        .map(ar => ar.room)
      const diagFogged = [this.topleft, this.topright, this.bottomleft, this.bottomright].filter(r =>
        !Game.rooms[r]
      )
      this._roomsToScout = adjcFogged.concat(diagFogged).filter(r => r)
    }
    return this._roomsToScout
  }

  get outposts() {
    if(!this._outposts) {
      this._outposts = this.adjacentRooms.filter(ar => ar.type === ROOM_TYPE_MY_OUTPOST)
        .map(r => Game.rooms[r.room].outpost)
    }
    return this._outposts
  }

  get farms() {
    if(!this._farms) {
      this._farms = this.adjacentRooms.filter(ar => ar.type === ROOM_TYPE_FARM)
        .map(r => Game.rooms[r.room])
    }
    return this._farms
  }

  get farmSources() {
    if(!this._farmSources) {
      this._farmSources = this.farms.map(f => f.sources).reduce((a, b) => a.concat(b), [])
    }
    return this._farmSources
  }

  get outpostSources() {
    if(!this._outpostSources) {
      this._outpostSources = this.outposts.map(o => o.sources).reduce((a, b) => a.concat(b), [])
    }
    return this._outpostSources
  }

  get outsideSources() {
    return this.farmSources.concat(this.outpostSources)
  }

  get hostileCreeps() {
    return this.nearRooms.map(r => r.find(FIND_HOSTILE_CREEPS)).reduce((a,b) => a.concat(b), [])
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
      if(this.storage)
        this._secondaryStorages.push(this.storage)
    }
    return this._secondaryStorages
  }

  // active provider containers,
  get tertiaryStorages() {
    if(!this._tertiaryStorages) {
      this._tertiaryStorages = this.sources.map(s => s.container).filter(s => s)
    }
    return this._tertiaryStorages
  }
}
