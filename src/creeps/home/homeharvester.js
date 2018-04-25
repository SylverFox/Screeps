const AbstractCreep = require('../abstractcreep')

module.exports = class HomeHarvester extends AbstractCreep {
  constructor(creep) {
    super(creep)

    this.autojobs = [this.UPGRADE, this.BUILD, this.REPAIR, this.WITHDRAW, this.PICKUP]
  }

  onNewJob() {
    const upgraders = this.home.getCreepJobsByRole(this.role).filter(j => j === this.UPGRADE).length

    if(this.empty()) {
      this.job = this.HARVEST
      this.target = this.availableSource
    } else if(this.home.savingEnergy) {
      this.job = this.TRANSFER
      this.target = this.targetfinder.findClosestDepositTarget(this.pos, this.home, this.getExcludedTargets(false))
    } else if(upgraders === 0) {
      this.job = this.UPGRADE
      this.target = this.room.controller
    } else if(this.home.myConstructionSites.length && !this.home.savingEnergy) {
      this.job = this.BUILD
      this.target = this.pos.findClosestByRange(this.home.myConstructionSites)
    } else if(this.room.controller && !this.home.savingEnergy) {
      this.job = this.UPGRADE
      this.target = this.room.controller
    } else {
      this.job = this.TRANSFER
      this.target = this.targetfinder.findClosestDepositTarget(this.pos, this.home, this.getExcludedTargets(false))
    }

    if(this.target)
      this.addExcludedTarget(this.target)
  }

  get availableSource() {
    if(!this._availableSource) {
      const minerTargets = this.home.getCreepTargetsByRole('homeMiner').concat(this.getExcludedTargets())
      const sources = this.home.sources.filter(
        s => minerTargets.filter(t => t === s).length < s.freeSpaces
      )
      if(sources.length)
        this._availableSource = this.pos.findClosestByRange(sources)
    }
    return this._availableSource
  }

  static build() {
    return [MOVE, MOVE, WORK, CARRY, CARRY]
  }
}
