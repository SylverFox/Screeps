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
  }



  performJob() {
    console.log('performJob not implemented for',this.role,'creep',this.name)
  }

  // returns true if in range of the target
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
      const sum = Object.keys(this.carry).map(r => this.carry[r]).reduce((a,b) => a+b)
      this._filledSpace = sum + this.carryOffset
    }
    return this._filledSpace
  }

  freeSpace() {
    return this.carryCapacity - this.filledSpace()
  }

  get carryOffset() {
    if(!this._carryOffset) {
      this._carryOffset = 0
    }
    return this._carryOffset
  }

  set carryOffset(offset) {
    this._carryOffset = offset
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
    if(!this._path && this.memory.path)
      this._path = Room.deserializePath(this.memory.path)
    return this._path
  }

  set path(path) {
    this.memory.path = Room.serializePath(path)
    this._path = path
  }
}
