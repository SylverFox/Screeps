const BaseCreep = require('./creeps.basecreep')

module.exports = class Claimer extends BaseCreep {
  constructor(creep) {
    super(creep)

    this.RESERVE = 1
    this.CLAIM = 2
  }

  performJob() {
    if(!this.job && !this.newJob()) return
    if(!this.target && !this.newTarget()) return

    let result
    if(this.job === this.RESERVE) {
      result = this.reserveController(this.target)
    } else if(this.job === this.CLAIM) {
      result = this.claimController(this.target)
    }

    if(result === OK) {

    } else if(result === ERR_NOT_IN_RANGE) {
      this.moveToTarget()
    } else {
      this.say(result)
    }
  }

  newJob() {
    this.job = null
    this.target = null

    const jobs = this.home.creepJobsByType(Claimer)

    if(Memory.nextBase && !jobs.includes(this.CLAIM))
      this.job = this.CLAIM
    else
      this.job = this.RESERVE

    return true
  }

  newTarget() {
    this.target = null
    if(this.job === this.RESERVE) {
      const exclude = this.home.creepTargetsByType(Claimer)
      this.target = this.home.farms.concat(this.home.outposts).map(f => f.controller)
        .find(f => !exclude.includes(f))
    } else if(this.job === this.CLAIM) {
      const newBase = Memory.nextBase
      if(newBase)
        this.target = Game.rooms[newBase.roomName].controller
    }

    if(!this.target) {
      this.say('zzz')
      this.job = null
      return false
    } else {
      return true
    }
  }
}
