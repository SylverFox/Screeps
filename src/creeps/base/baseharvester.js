const AbstractCreep = require('../abstractcreep')

module.exports = class BaseHarvester extends AbstractCreep {
  constructor(creep) {
    super(creep)

    this.autojobs = [this.UPGRADE, this.BUILD, this.REPAIR, this.WITHDRAW, this.PICKUP]
  }

  onNewJob() {
    if(this.empty()) {
      this.job = this.HARVEST
      this.target = this.availableSource
    } else if(this.room.myConstructionSites.length) {
      this.job = this.BUILD
      this.target = this.pos.findClosestByRange(this.room.myConstructionSites)
    } else if(this.room.repairableStructures.length) {
      this.job = this.REPAIR
      this.target = this.pos.findClosestByRange(this.room.repairableStructures)
    } else {
      this.job = this.STORE_ENERGY
      this.target = this.targetfinder.findClosestDepositTarget(this.pos, this.home, this.getExcludedTargets(false), true)
    }

    if(this.target)
      this.addExcludedTarget(this.target)
  }

  get availableSource() {
    if(!this._availableSource) {
      const sources = this.home.outpostSources.filter(
        s => this.getExcludedTargets().filter(t => t === s).length < s.freeSpaces
      )
      if(sources.length)
        this._availableSource = this.targetfinder.findClosestByWorldRange(this.pos, sources)
    }
    return this._availableSource
  }

  static build() {
    return [MOVE, MOVE, WORK, CARRY, CARRY]
  }
}
