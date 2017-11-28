module.exports = class BaseCreep extends Creep {
  constructor(creep) {
    super(creep.id)
    Object.assign(this, creep)

    // CONSTANTS
    this.TARGET_IN_RANGE = 0b10
    this.MOVED = 0b01
    this.MOVED_TARGET_IN_RANGE = 0b11
    this.MOVED_TARGET_NOT_IN_RANGE = 0b01
    this.UNABLE_TO_MOVE = 0b100

    this.moveOpts = {
      visualizePathStyle: {
        fill: 'transparent',
        stroke: '#fff',
        lineStyle: 'dashed',
        strokeWidth: .15,
        opacity: .5
      }
    }

    this.HARVEST = 'harvest'
    // TODO deprecate
    this.STORE = 'store'
    this.BUILD = 'build'
    this.REPAIR = 'repair'
    this.UPGRADE = 'upgrade'
    this.STORE_ENERGY = 'store_energy'
    this.COLLECT_ENERGY = 'collect_energy'
    this.PICKUP = 'pickup'
    this.RESERVE = 'reserve'
    this.CLAIM = 'claim'

    this.enableHurry = false
    this.maxJobTries = 10

    this.maxStuck = 3
  }



  performJob() {
    if((!this.job || !this.target) && !this._newJob())
      return

    let result
    if(this.job === this.HARVEST)
      result = this.harvest(this.target)
    else if(this.job === this.BUILD)
      result = this.build(this.target)
    else if(this.job === this.REPAIR)
      result = this.repair(this.target)
    else if(this.job === this.UPGRADE)
      result = this.upgradeController(this.target)
    else if(this.job === this.STORE_ENERGY)
      result = this.transfer(this.target, RESOURCE_ENERGY)
    else if(this.job === this.COLLECT_ENERGY)
      result = this.withdraw(this.target, RESOURCE_ENERGY)
    else if(this.job === this.PICKUP)
      result = this.pickup(this.target)
    else if(this.job === this.RESERVE)
      result = this.reserveController(this.target)
    else if(this.job === this.CLAIM)
      result = this.claimController(this.target)

    this.jobTries = 1 + (this.jobTries || 0)
    if(this.jobTries > this.maxJobTries) {
      console.log('max tries for',this.role,this.job)
      return
    }

    if(result === OK) {
      const jobDone = this.handleJobOK()
      if(jobDone) {
        this._newJob()
        if(this.enableHurry)
          this.performJob()
      }
    } else if(result === ERR_NOT_IN_RANGE) {
      this.moveToTarget_new()
    } else if(result === ERR_FULL) {
      this._newJob()
      this.say('full')
    } else if(result === ERR_NOT_ENOUGH_RESOURCES) {
      this._newJob()
      this.say('empty')
    } else if(result === ERR_INVALID_TARGET) {
      this._newJob()
      this.say('inv target')
    } else {
      this.say(this.job.slice(0, 6)+' '+result)
    }
  }

  // placeholder for new job
  newJob() {
    console.log('new job not implemented for',this.role,this.name)
  }

  // placeholder for handle job ok
  handleJobOK() {
    console.log('job OK not implemented for',this.role,this.name)
  }

  _newJob() {
    // clear state
    this.job = null
    this.target = null
    this.path = null
    this.lastPos = null

    this.newJob()

    if(!this.job || !this.target) {
      this.say('zzz')
      return false
    } else {
      return true
    }
  }

  _getRangeByJob() {
    const rangedThree = [this.UPGRADE, this.REPAIR, this.BUILD]
    if(rangedThree.includes(this.job))
      return 3
    else
      return 1
  }

  // TODO split inter-room movement
  moveToTarget_new(range) {
    let _range = range || this._getRangeByJob()

    let ignoreCreeps = true
    if(this.lastPos && this.pos.isEqualTo(this.lastPos)) {
      this.stuckCount = this.stuckCount +1
      if(this.stuckCount > this.maxStuck) {
        this.say('stuck')
        this.path = null

        ignoreCreeps = false
      }
    } else {
      this.stuckCount = 0
    }

    if(!this.path) {
      let path
      if(this.room === this.target.room) {
        path = this.pos.findPathTo(this.target.pos, {
          ignoreCreeps: ignoreCreeps
        })
      } else {
        _range = 0
        const route = Game.map.findRoute(this.room, this.target.room)
        if(route.length) {
          const exit = this.pos.findClosestByPath(route[0].exit)
          path = this.pos.findPathTo(exit, {
            ignoreCreeps: ignoreCreeps
          })
        }
      }

      if(!path) {
        this.say('no path')
        return
      }

      this.path = _range ? path.slice(0, -1 * _range) : path
    }

    const path = this.path
    const result = this.moveByPath(path)

    if(result === OK) {
      // moved
      this.lastPos = this.pos
    } else if(result === ERR_NOT_FOUND) {
      this.say('not found')
      this.path = null
    } else if(result === ERR_INVALID_ARGS) {
      console.log('invalid path')
    } else if(result === ERR_TIRED) {
      // fatigued
    }

  }

  // returns true if in range of the target
  // @deprecated
  moveToTarget(target = this.target, range = 1) {
    let result = 0
    const dist = this.pos.getRangeTo(target)

    if(dist <= range) {
      return this.TARGET_IN_RANGE
    }

    if(!this.path)
      this.path = this.pos.findPathTo(target)

    // TODO use cached path
    //const moveResult = this.moveByPath(this.path)
    const moveResult = this.moveTo(target, this.moveOpts)

    //if(moveResult !== OK) console.log('move error',moveResult)

    if(moveResult === OK) {
      this.hasMoved = true
      result |= this.MOVED
      if(dist === range + 1)
        result |= this.TARGET_IN_RANGE
    } else if(moveResult === ERR_NOT_FOUND) {
      this.say('lost')
      this.path = this.pos.findPathTo(target)
    } else {
      return this.UNABLE_TO_MOVE
    }

    return result
  }

  full() {
    return this.freeSpace() <= 0
  }

  empty() {
    return this.filledSpace() <= 0
  }

  filledSpace() {
    if(!this._filledSpace) {
      this._filledSpace = Object.keys(this.carry).map(r => this.carry[r]).reduce((a,b) => a+b)
    }
    return this._filledSpace + (this.carryOffset || 0)
  }

  freeSpace() {
    return this.carryCapacity - this.filledSpace()
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
    if(target && target.id)
      this.memory.target = target.id
    else
      this.memory.target = target

    this._target = target
  }

  // returns home base
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
}
