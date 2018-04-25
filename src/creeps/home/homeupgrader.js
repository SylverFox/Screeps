const AbstractCreep = require('../abstractcreep')

module.exports = class HomeUpgrader extends AbstractCreep {
  constructor(creep) {
    super(creep)

    this.autojobs = [this.WITHDRAW]
  }

  onNewJob(job) {
    if(this.full()) {
      this.job = this.UPGRADE
      this.target = this.home.controller
    } else {
      this.job = this.WITHDRAW
      this.target = this.targetfinder.findClosestRetrievingTarget(
        this.home.controller.pos, this.home, this.getExcludedTargets(false)
      )
    }

    if(this.target) {
      this.addExcludedTarget(this.target)
    }
  }

  static build(maxEnergy) {
    return this._creepFromSet([MOVE, CARRY], [MOVE, WORK, WORK, WORK, WORK, WORK], 3, maxEnergy)
  }
}
