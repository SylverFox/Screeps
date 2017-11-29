const BaseCreep = require('./creeps.basecreep')
const targetfinder = require('./utils.targetfinder')

module.exports = class Transporter extends BaseCreep {
  constructor(creep) {
    super(creep)

    this.enableHurry = true
  }

  newJob() {
    const collectTarget = targetfinder.findFullestCollectTarget(this.pos, this.home, this.getExcludedTargets())
    const collectDist = collectTarget ? targetfinder.worldDistance(this.pos, collectTarget.pos) : Infinity
    const storeTarget = targetfinder.findClosestDepositTarget(this.pos, this.home, this.getExcludedTargets(false))
    const storeDist = storeTarget ? targetfinder.worldDistance(this.pos, storeTarget.pos) : Infinity
    const dropTarget = targetfinder.findClosestByWorldRange(this.pos, this.home.drops, this.getExcludedTargets())
    const dropDist = dropTarget ? targetfinder.worldDistance(this.pos, dropTarget.pos) : Infinity

    if (this.empty() || (storeDist > collectDist && storeDist > dropDist)) {
      if(dropTarget) {
        this.job = this.PICKUP
        this.target = dropTarget
      } else if(collectTarget) {
        this.job = this.COLLECT_ENERGY
        this.target = collectTarget
      }
    } else {
      if(storeTarget) {
        this.job = this.STORE_ENERGY
        this.target = storeTarget
      }
    }

    // make sure this target is not chosen again in this tick
    if(this.target)
      this.addExcludedTarget(this.target)
  }

  handleJobOK() {
    let offset = 0
    if(this.job === this.PICKUP) {
      offset = Math.min(this.freeSpace(), this.target.amount)
    } else if (this.job === this.COLLECT_ENERGY) {
      offset = Math.min(this.freeSpace(), this.target.filledSpace)
    } else if(this.job === this.STORE_ENERGY) {
      offset = -1 * Math.min(this.filledSpace(), this.target.freeSpace)
    }

    this.carryOffset = offset + (this.carryOffset || 0)
    return true
  }

  reviewTarget() {
    if(this.job === this.PICKUP) {
      if(!this.target)
        this.target = null
    } else if(this.job === this.COLLECT_ENERGY) {
      if(this.target.filledSpace === 0)
        this.target = null
    } else if(this.job === this.STORE_ENERGY) {
      if(this.target.freeSpace === 0)
        this.target = null
    }
  }
}
