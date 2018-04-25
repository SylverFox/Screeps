const AbstractCreep = require('../abstractcreep')

module.exports = class Distributor extends AbstractCreep {
  constructor(creep) {
    super(creep)
  }

  performJob() {
    if(this.memory.job === 'collect') {
      const target = Game.getObjectById(this.memory.collectTarget)
      if(this.pos.inRangeTo(target, 1)) {
        const res = this.withdraw(target, RESOURCE_ENERGY)
        if(res === OK) {
          this.carryOffset += Math.min(this.freeSpace, target.filledSpace)
        }
        this.newJob()
        this.say(res)
      }
      this.travel()
    } else if(this.memory.job === 'transfer') {
      if(!this.memory.transferTarget) {
        this.newJob()
      }

      if(this.memory.transferTarget) {
        const target = Game.getObjectById(this.memory.transferTarget)
        if(!target) {
          delete this.memory.transferTarget
          return
        }
        if(this.pos.inRangeTo(target, 1)) {
          const res = this.transfer(target, RESOURCE_ENERGY)
          if(res === OK) {
            this.carryOffset -= Math.min(this.filledSpace, target.freeSpace)
          }

          this.newJob()
          this.say(res)
        }
        this.travel()
      }

    } else {
      this.memory.collectTarget = this.room.storage.id
      this.memory.job = 'collect'
    }
  }

  newJob() {
    if(this.empty()) {
      this.job = 'collect'
    } else {
      this.job = 'transfer'
      this.memory.transferTarget = this.targetfinder.findClosestDepositTarget(this.pos, this.home, [Game.getObjectById(this.memory.transferTarget)]).id
    }
  }

  travel() {
    if(this.job === 'collect') {
      this.travelTo(Game.getObjectById(this.memory.collectTarget))
    } else if(this.job === 'transfer') {
      this.travelTo(Game.getObjectById(this.memory.transferTarget))
    }
  }

  travelTo(target, range = 1) {
    if(!this.memory.travel) this.memory.travel = {}

    if(!(this.memory.travel.path && this.memory.travel.path.length)) {
      this.memory.travel.path = this.pos.findPathTo(target).map(p => p.direction).slice(0, -range)
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

  static build(maxEnergy) {
    return this._creepFromSet([], [MOVE, CARRY, CARRY], 6, maxEnergy)
  }
}
