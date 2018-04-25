const AbstractCreep = require('../abstractcreep')

module.exports = class BaseBuilder extends AbstractCreep {
  constructor(creep) {
    super(creep)
  }

  onNewJob() {
    const withdrawTarget = this.targetfinder.findClosestRetrievingTarget(
      this.pos, this.home, this.getExcludedTargets(false), true
    )
    let buildTarget = this.home.baseConstructionSites.find(
      s => s.structureType === STRUCTURE_SPAWN
    )
    if(!buildTarget) {
      buildTarget = this.targetfinder.findClosestByWorldRange(
        this.pos, this.home.baseConstructionSites, this.getExcludedTargets(false)
      )
    }

    let jobs = []
    if(!this.empty() && buildTarget) {
      jobs.push({
        job: this.BUILD,
        target: buildTarget,
        dist: this.targetfinder.worldDistance(this.pos, buildTarget.pos)
      })
    } else if(!this.full() && withdrawTarget) {
      jobs.push({
        job: this.WITHDRAW,
        target: withdrawTarget,
        dist: this.targetfinder.worldDistance(this.pos, withdrawTarget.pos)
      })
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
    return this._creepFromSet([MOVE, WORK], [MOVE, CARRY], 10, maxEnergy)
  }
}
