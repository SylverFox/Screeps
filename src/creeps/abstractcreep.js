const targetfinder = require('../utils/targetfinder')

module.exports = class AbstractCreep extends Creep {
  constructor(creep) {
    super(creep.id)
    Object.assign(this, creep)

    this.targetfinder = targetfinder

    // supported jobs
    this.HARVEST = 'harvest'
    this.MINE = 'mine'
    this.BUILD = 'build'
    this.REPAIR = 'repair'
    this.UPGRADE = 'upgrade'
    this.WITHDRAW = 'withdraw'
    this.TRANSFER = 'transfer'
    this.TRANSFER_ALL = 'transferAll'
    this.PICKUP = 'pickup'
    this.RESERVE = 'reserve'
    this.CLAIM = 'claim'
    this.SCOUT = 'scout'

    // list of autojobs that a creep can override
    this.autojobs = []

    // wether this creep is at its end of life sequence
    this.dying = false
  }

  // placeholder for end of life sequence
  handleEOL() {}

  // placeholder for new job
  onNewJob() {
    console.log('new job not implemented for',this.role,this.name)
  }

  // placeholder for handle job ok
  onJobOK() {
    console.log('job OK not implemented for',this.role,this.name)
  }

  performJob() {
    // on edge fix
    if(this.pos.x % 49 === 0) {
      this.moveTo((this.pos.x + 1) % 49, this.pos.y)
      return
    } else if(this.pos.y % 49 === 0) {
      this.moveTo(this.pos.x, (this.pos.y + 1) % 49)
      return
    }

    // handle end of life for a creep
    this._handleEOL()
    // check if target is still valid
    this._reviewTarget()

    // verify that the creep has something to do
    if((!this.job || !this.target) && !this._newJob())
      return

    // attempt to execute the job
    const result = this._executeJob()

    // do additional jobs if the creep supports it
    const _autojobs = this.autojobs.filter(j => j !== this.job)
    this._doAutoJobs(_autojobs)

    if(result === OK) {
      const jobDone = this._onJobOK()
      if(jobDone) {
        this._newJob()
        if(this.job && this.target && !this._inRangeToTarget())
          this.moveTo(this.target, {reusePath: 10})
      }
    } else if(result === ERR_NOT_IN_RANGE) {
      if(this.job === this.MINE) {
        this.moveTo(this.target.container)
      } else if(this.job === this.RESERVE) {
        this.moveTo(Game.rooms[this.target].controller)
      } else {
        this.moveTo(this.target, {resusePath: 10})
      }
    } else if([ERR_FULL, ERR_NOT_ENOUGH_ENERGY, ERR_INVALID_TARGET].includes(result)) {
      // if the target is reviewed and interal state is kept correctly, this should not happen
      this.say(EMOJI_CONFUSED+' '+result)
      this._newJob()
      if(this.job && this.target && !this._inRangeToTarget())
        this.moveTo(this.target)
    } else {
      this.say(EMOJI_CONFUSED+' '+result)
    }
  }

  _reviewTarget() {
    // target will be invalid for jobs: build, pickup
    if(!this.target)
      return

    if(this.job === this.HARVEST) {
      if(this.target.energy === 0)
        this.target = null
    } if(this.job === this.REPAIR) {
      if(this.target.hits === this.target.hitsMax)
        this.target = null
    } else if(this.job === this.WITHDRAW) {
      if(this.target.filledSpace === 0)
        this.target = null
    } else if(this.job === this.TRANSFER || this.job === this.TRANSFER_ALL) {
      if(this.target.freeSpace === 0)
        this.target = null
    } else if(this.job === this.CLAIM) {
      if(this.target.my)
        this.target = null
    }
  }

  _handleEOL() {
    if(!this.dying)
      this.dying = !!this.handleEOL()
  }

  _newJob() {
    // clear state
    this.job = null
    this.target = null
    this.path = null
    this.lastPos = null

    this.onNewJob()

    if(!this.job || !this.target) {
      this.say(EMOJI_SLEEPING)
      return false
    } else {
      return true
    }
  }

  _executeJob(job, target) {
    const _job = job || this.job
    const _target = target || this.target

    let result
    if(_job === this.HARVEST) {
      result = this.harvest(_target)
    } else if(_job === this.MINE) {
      result = this.harvest(_target)
    } else if(_job === this.BUILD) {
      result = this.build(_target)
    } else if(_job === this.REPAIR) {
      result = this.repair(_target)
    } else if(_job === this.UPGRADE) {
      result = this.upgradeController(_target)
    } else if(_job === this.TRANSFER) {
      result = this.transfer(_target, RESOURCE_ENERGY)
    } else if(_job === this.TRANSFER_ALL) {
      for(let r in this.carry) {
        result = this.transfer(_target, r)
        if(result !== OK) {
          break
        }
      }
    } else if(_job === this.WITHDRAW) {
      result = this.withdraw(_target, RESOURCE_ENERGY)
    } else if(_job === this.PICKUP) {
      result = this.pickup(_target)
    } else if(_job === this.RESERVE) {
      if(Game.rooms[_target])
        result = this.reserveController(Game.rooms[_target].controller)
      else
        result = this.moveTo(new RoomPosition(25, 25, _target))
    } else if(_job === this.CLAIM) {
      result = this.claimController(_target)
    } else if(_job === this.SCOUT) {
      result = this.moveTo(new RoomPosition(25, 25, _target))
    }

    if(result === OK)
      this._updateInternalState(_job, _target)

    return result
  }

  _updateInternalState(job, target) {
    const _job = job || this.job
    const _target = target || this.target

    if(_job === this.HARVEST) {
      this.carryOffset += this.workParts * HARVEST_POWER
    } else if(_job === this.MINE) {
      this.carryOffset += this.workParts * HARVEST_POWER
    } else if(_job === this.BUILD) {
      this.carryOffset -= this.workParts * BUILD_POWER
    } else if(_job === this.REPAIR) {
      this.carryOffset -= this.workParts
    } else if(_job === this.UPGRADE) {
      this.carryOffset -= this.workParts
    } else if(_job === this.WITHDRAW) {
      this.carryOffset += Math.min(this.freeSpace, _target.filledSpace)
    } else if(_job === this.TRANSFER || _job === this.TRANSFER_ALL) {
      this.carryOffset -= Math.min(this.filledSpace, _target.freeSpace)
    } else if(_job === this.PICKUP) {
      this.carryOffset += Math.min(this.freeSpace, _target.amount)
    }
  }

  _onJobOK() {
    let done

    if (this.job === this.HARVEST) {
      done = this.full()
    } else if(this.job === this.MINE) {
      if(!this.pos.isEqualTo(this.target.container))
        this.moveTo(this.target.container)
      done = false
    } else if(this.job === this.BUILD) {
      done = this.empty() ||
        this.target.progress + this.workParts * BUILD_POWER >= this.target.progressTotal
    } else if(this.job === this.REPAIR) {
      done = this.empty() ||
        this.target.hits + this.workParts * REPAIR_POWER >= this.target.hitsMax
    } else if(this.job === this.UPGRADE) {
      done = this.empty()
    } else if(this.job === this.WITHDRAW) {
      done = true
    } else if(this.job === this.TRANSFER || this.job === this.TRANSFER_ALL) {
      done = true
    } else if(this.job === this.PICKUP) {
      done = true
    } else if(this.job === this.RESERVE) {
      done = false
    } else if(this.job === this.CLAIM) {
      done = true
    } else if(this.job === this.SCOUT) {
      done = this.room.name === this.target
    } else {
      done = this.onJobOK()
    }

    return done
  }

  _inRangeToTarget() {
    const range = [this.UPGRADE, this.REPAIR, this.BUILD].includes(this.job) ? 3 : 1
    return this.pos.inRangeTo(this.target, range)
  }

  _doAutoJobs(jobs) {
    // filter out the current jo
    const _jobs = jobs || this.autojobs

    const sq1 = {
      top: this.pos.y-1 < 0 ? 0 : this.pos.y-1,
      left: this.pos.x-1 < 0 ? 0 : this.pos.x-1,
      bottom: this.pos.y+1 > 49 ? 49 : this.pos.y+1,
      right: this.pos.x+1 > 49 ? 49 : this.pos.x+1
    }
    const sq3 = {
      top: this.pos.y-3 < 0 ? 0 : this.pos.y-3,
      left: this.pos.x-3 < 0 ? 0 : this.pos.x-3,
      bottom: this.pos.y+3 > 49 ? 49 : this.pos.y+3,
      right: this.pos.x+3 > 49 ? 49 : this.pos.x+3
    }

    for(let job of _jobs) {
      if(job === this.UPGRADE) {
        const adjcController = this.room.lookForAtArea(
          LOOK_STRUCTURES, sq3.top, sq3.left, sq3.bottom, sq3.right, true
        ).find(
          s => s.structure.structureType === STRUCTURE_CONTROLLER &&
          s.structure.my &&
          !s.structure.pos.isEqualTo(this.pos)
        )
        if(adjcController)
          this.upgradeController(adjcController.structure)
      } else if(job === this.BUILD) {
        const adjcConstruction = this.room.lookForAtArea(
          LOOK_CONSTRUCTION_SITES, sq3.top, sq3.left, sq3.bottom, sq3.right, true
        ).find(s => s.constructionSite.my && !s.constructionSite.pos.isEqualTo(this.pos))
        if(adjcConstruction)
          this.build(adjcConstruction.constructionSite)
      } else if(job === this.REPAIR) {
        const adjcRepairable = this.room.lookForAtArea(
          LOOK_STRUCTURES, sq3.top, sq3.left, sq3.bottom, sq3.right, true
        ).map(s => s.structure).find(
          s => (s.hits + this.workParts * 100) < s.hitsMax
        )
        if(adjcRepairable)
          this.repair(adjcRepairable)
      } else if(job === this.WITHDRAW) {
        // withdraw energy from adjacent container
        const adjcContainer = this.room.lookForAtArea(
          LOOK_STRUCTURES, sq1.top, sq1.left, sq1.bottom, sq1.right, true
        ).find(
          s => s.structure.structureType === STRUCTURE_CONTAINER &&
          s.structure.store[RESOURCE_ENERGY] > 0 &&
          s.structure.canWithdraw
        )
        if(adjcContainer) {
          this.withdraw(adjcContainer.structure, RESOURCE_ENERGY)
        }
      } else if(job === this.PICKUP) {
        const adjcDrop = this.room.lookForAtArea(
          LOOK_RESOURCES, sq1.top, sq1.left, sq1.bottom, sq1.right, true
        ).find(s => s)
        if(adjcDrop)
          this.pickup(adjcDrop.resource)
      }
    }
  }

  travelTo(target, range = 1) {
    if(!this.memory.travel) this.memory.travel = {}

    if(!(this.memory.travel.path && this.memory.travel.path.length)) {
      const path = this.pos.findPathTo(target).map(p => p.direction)
      this.memory.travel.path = path.slice(0, path.length-range)
      delete this.memory.travel.nextstep
      delete this.memory.travel.lastpos
      delete this.memory.travel.stuck
    }

    const lastpos = this.memory.travel.lastpos
    if(lastpos && this.pos.isEqualTo(lastpos.x, lastpos.y)) {
      // stuck
      this.memory.travel.stuck++
      this.say('stk ' + this.memory.travel.stuck)
      if(this.memory.travel.stuck > 3)
        delete this.memory.travel.path
    } else {
      this.memory.travel.lastpos = {
        x: this.pos.x,
        y: this.pos.y
      }
      this.memory.travel.stuck = 0
      this.memory.travel.nextstep = this.memory.travel.path.shift()
    }

    this.move(this.memory.travel.nextstep)
  }

  full() {
    return this.freeSpace <= 0
  }

  empty() {
    return this.filledSpace <= 0
  }

  getExcludedTargets(includeShared = true) {
    if(!this._excludedTargets || !this._sharedExcludedTargets) {
      this._excludedTargets = []
      this._sharedExcludedTargets = this.home.getCreepTargetsByRole(this.role)
    }
    return includeShared ? this._excludedTargets.concat(this._sharedExcludedTargets) : this._excludedTargets
  }

  addExcludedTarget(target) {
    if(!this._excludedTargets)
      this._excludedTargets = []
    if(target)
      this._excludedTargets.push(target)
  }

  get role() {
    if(!this._role)
      this._role = this.memory.role
    return this._role
  }

  get job() {
    if(!this._job)
      this._job = this.memory.job
    return this._job
  }

  set job(job) {
    this.memory.job = job
    this._job = job
  }

  get target() {
    if(!this._target && this.memory.target) {
      const object = Game.getObjectById(this.memory.target)
      this._target = object ? object : this.memory.target
    }
    return this._target
  }

  set target(target) {
    this.memory.target = target && target.id ? target.id : target
    this._target = target
  }

  get home() {
    if(!this._home)
      this._home = Game.rooms[this.memory.home].base
    return this._home
  }

  get path() {
    if(!this._path && this.memory.path) {
      this._path = Room.deserializePath(this.memory.path)
    }
    return this._path
  }

  set path(path) {
    this.memory.path = path ? Room.serializePath(path) : null
    this._path = path
  }

  get lastPos() {
    if(!this._lastPos && this.memory.lastPos)
      this._lastPos = new RoomPosition(...this.memory.lastPos)
    return this._lastPos
  }

  set lastPos(pos) {
    this.memory.lastPos = pos ? [pos.x, pos.y, pos.roomName] : null
    this._lastPos = pos
  }

  get stuckCount() {
    if(!this._stuckCount)
      this._stuckCount = this.memory.stuckCount || 0
    return this._stuckCount
  }

  set stuckCount(c) {
    this.memory.stuckCount = c
    this._stuckCount = c
  }

  get filledSpace() {
    if(!this._filledSpace) {
      this._filledSpace = Object.keys(this.carry).map(r => this.carry[r]).reduce((a,b) => a+b)
    }
    return this._filledSpace + this.carryOffset
  }

  get freeSpace() {
    return this.carryCapacity - this.filledSpace
  }

  get nonEnergyCarry() {
    if(!this._nonEnergyCarry)
      this._nonEnergyCarry = this.filledSpace - this.carry[RESOURCE_ENERGY] - this.carryOffset
    return this._nonEnergyCarry
  }

  get carryOffset() {
    if(!this._carryOffset)
      this._carryOffset = 0
    return this._carryOffset
  }

  set carryOffset(offset) {
    this._carryOffset = offset
  }

  get workParts() {
    if(!this._workParts)
      this._workParts = this.body.filter(b => b === WORK).length
    return this._workParts
  }

  static _creepFromSet(base, set, maxSets, maxEnergy) {
    const baseCost = base.map(p => BODYPART_COST[p]).reduce((a, b) => a + b, 0)
    const setCost = set.map(p => BODYPART_COST[p]).reduce((a, b) => a + b, 0)
    const leftover = maxEnergy - baseCost
    const max = Math.min(Math.floor(leftover / setCost), maxSets) || 1
    return Array(max).fill(set).reduce((a, b) => a.concat(b), []).concat(base).filter(p => p).sort()
  }
}
