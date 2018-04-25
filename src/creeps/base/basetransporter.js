const AbstractCreep = require('../abstractcreep')

module.exports = class BaseTransporter extends AbstractCreep {
  constructor(creep) {
    super(creep)

    this.autojobs = [this.BUILD, this.REPAIR, this.WITHDRAW, this.PICKUP]
  }

  onNewJob() {
    const collectTarget = this.targetfinder.findFullestCollectTarget(this.pos, this.home, this.getExcludedTargets(), true)
    const storeTarget = this.targetfinder.findClosestDepositTarget(this.pos, this.home, this.getExcludedTargets(false), true)
    const dropTarget = this.targetfinder.findClosestByWorldRange(this.pos, this.home.baseDrops, this.getExcludedTargets(), true)

    let jobs = []
    if(!this.empty() && storeTarget) {
      if(this.carry[RESOURCE_ENERGY] === this.filledSpace) {
        jobs.push({
          job: this.TRANSFER,
          target: storeTarget,
          dist: this.targetfinder.worldDistance(this.pos, storeTarget.pos)
        })
      } else {
        jobs.push({
          job: this.TRANSFER_ALL,
          target: this.home.storage,
          dist: this.targetfinder.worldDistance(this.pos, this.home.storage.pos)
        })
      }
    }
    if(!this.full()) {
      if(collectTarget && (!(collectTarget instanceof StructureStorage) || storeTarget)) {
        jobs.push({
          job: this.WITHDRAW,
          target: collectTarget,
          dist: this.targetfinder.worldDistance(this.pos, collectTarget.pos)
        })
      }
      if(dropTarget) {
        jobs.push({
          job: this.PICKUP,
          target: dropTarget,
          dist: this.targetfinder.worldDistance(this.pos, dropTarget.pos)
        })
      }
    }

    if(!jobs.length)
      return

    jobs.sort((a, b) => a.dist - b.dist)
    this.job = jobs[0].job
    this.target = jobs[0].target

    if(this.target)
      this.addExcludedTarget(this.target)
  }

  static build(maxEnergy) {
    return this._creepFromSet([MOVE, WORK], [MOVE, CARRY, CARRY], 16, maxEnergy)
  }
}
