const AbstractCreep = require('../abstractcreep')

module.exports = class HomeMechanic extends AbstractCreep {
  constructor(creep) {
    super(creep)

    this.autojobs = [this.UPGRADE, this.BUILD, this.REPAIR, this.WITHDRAW, this.PICKUP]
  }

  onNewJob() {
    const mechs = this.home.getCreepJobsByRole(this.role)
    const total = mechs.length + 1
    const repairers = mechs.filter(m => m === this.REPAIR).length

    if(this.empty()) {
      this.job = this.WITHDRAW
      this.target = this.targetfinder.findClosestRetrievingTarget(this.pos, this.home, this.getExcludedTargets(false))
    } else if (this.home.myConstructionSites.length) {
      this.job = this.BUILD
      this.target = this.targetfinder.findBestConstructionTarget(this.pos, this.home, this.getExcludedTargets(false))
    } else if (this.home.repairableDefenses.length && repairers === 0) {
      this.job = this.REPAIR
      this.target = this.targetfinder.findClosestByWorldRange(this.pos, this.home.repairableDefenses, this.getExcludedTargets(false))
    } else {
      this.job = this.UPGRADE
      const hasUpgraded = this.getExcludedTargets(false).includes(this.home.controller)
      if(!hasUpgraded)
        this.target = this.home.controller
    }

    if(this.target) {
      this.addExcludedTarget(this.target)
    }
  }

  static build(maxEnergy) {
    return this._creepFromSet([], [WORK, CARRY, MOVE], 10, maxEnergy)
  }
}
