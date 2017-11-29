const BaseCreep = require('./creeps.basecreep')
const targetfinder = require('./utils.targetfinder')

module.exports = class Mechanic extends BaseCreep {
  constructor(creep) {
    super(creep)

    this.enableHurry = true
  }

  newJob(job) {
    const mechs = this.home.getCreepJobsByType(Mechanic)
    const total = mechs.length + 1
    const upgraders = mechs.filter(m => m === this.UPGRADE).length
    const builders = mechs.filter(m => m === this.BUILD).length
    const repairers = mechs.filter(m => m === this.REPAIR).length

    if(this.empty()) {
      this.job = this.COLLECT_ENERGY
      this.target = targetfinder.findClosestRetrievingTarget(this.pos, this.home)
    } else if (upgraders === 0) {
      this.job = this.UPGRADE
      const hasUpgraded = this.getExcludedTargets(false).includes(this.home.controller)
      if(!hasUpgraded)
        this.target = this.home.controller
    } else if (this.home.myConstructionSites.length && builders < total * 0.75) {
      this.job = this.BUILD
      const targets = this.home.myConstructionSites.filter(s => !this.getExcludedTargets(false).includes(s))
      this.target = targetfinder.findClosestByWorldRange(this.pos, targets)
    } else if (this.home.damagedStructures.length && repairers < total * 0.25) {
      this.job = this.REPAIR
      const targets = this.home.damagedStructures.filter(s => !this.getExcludedTargets(false).includes(s))
      this.target = targetfinder.findClosestByWorldRange(this.pos, targets)
    } else {
      this.job = this.UPGRADE
      const hasUpgraded = this.getExcludedTargets(false).includes(this.home.controller)
      if(!hasUpgraded)
        this.target = this.home.controller
    }

    if(this.target)
      this.addExcludedTarget(this.target)
  }

  handleJobOK() {
    let done = false
    const workParts = this.body.filter(b => b === WORK).length

    if (this.job === this.COLLECT_ENERGY) {
      this.carryOffset += Math.min(this.freeSpace(), this.target.filledSpace)
      if(!this.full()) {
        this.target = targetfinder.findClosestRetrievingTarget(this.pos, this.home, this.getExcludedTargets(false))
        done = !!this.target
      }
    } else if(this.job === this.BUILD) {
      this.carryOffset -= workParts * BUILD_POWER
      done = this.empty()
    } else if(this.job === this.UPGRADE) {
       this.carryOffset -= workParts * UPGRADE_CONTROLLER_POWER
       done = this.empty()
    } else if(this.job === this.REPAIR) {
      this.carryOffset -= workParts * BUILD_POWER
      done = this.empty()
    }

    return done
  }

  reviewTarget() {
    if(this.job === this.BUILD) {
      if(!this.target)
        this.target = null
    } else if(this.job === this.REPAIR) {
      if(!(this.target && this.target.hits !== this.target.hitsMax))
        this.target = null
    } else if(this.job === this.COLLECT_ENERGY) {
      if(this.target.filledSpace === 0)
        this.target = null
    }
  }
}
