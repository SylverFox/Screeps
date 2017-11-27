const BaseCreep = require('./creeps.basecreep')
const targetfinder = require('./utils.targetfinder')

module.exports = class Transporter extends BaseCreep {
  constructor(creep) {
    super(creep)

    this.COLLECT = 1
    this.STORE = 2
  }

  performJob() {
    // find a new job if undefined and possible, otherwise do nothing
    if(!this.job && !this.newJob()) return
    // find a new target if undefined and possible, otherwise do nothing
    if (!this.target && !this.newTarget()) return

    // try to perform task base on job
    let result, offset
    if (this.job === this.COLLECT) {
      const targetEnergy = this.target instanceof Resource ? this.target.amount :
        this.target.filledSpace
      offset = Math.min(this.freeSpace(), targetEnergy)

      result = this.target instanceof Resource ? this.pickup(this.target) :
        this.withdraw(this.target, RESOURCE_ENERGY)
    } else if(this.job === this.STORE) {
      offset = -1 * Math.min(this.filledSpace(), this.target.freeSpace)

      result = this.transfer(this.target, RESOURCE_ENERGY)
    }
    //this.say(result)

    // take action based on result of job
    if(result === OK) {
      // action was performed, change internal state of the creep and try to do more
      this.carryOffset += offset
      this.newJob()
      //this.performJob()
    } else if(result === ERR_NOT_IN_RANGE) {
      this.moveToTarget()
    } else if(result === ERR_NOT_ENOUGH_RESOURCES || result === ERR_FULL || result === ERR_INVALID_TARGET) {
      // invalid target, choose new target and try again if found
      //if(this.newTarget())
        //this.performJob()
      this.newJob()
    } else {
      // uknown result, for debugging
      this.say(result)
    }
  }

  newJob() {
    // TODO balance on targets
    if (this.empty())
      this.job = this.COLLECT
    else
      this.job = this.STORE

    this.target = null
    //this.performJob()
    return true
  }

  newTarget() {
    if(this.job === this.COLLECT) {
      const exclude = this.home.creepTargetsByType(Transporter)
      this.target = targetfinder.findClosestCollectTarget(this, exclude)
    } else if(this.job === this.STORE) {
      this.target = targetfinder.findClosestStoringDeposit(this)
    }

    if(!this.target) {
      this.say('zzz')
      return false
    } else {
      return true
    }
  }
}
