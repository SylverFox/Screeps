const BaseCreep = require('./creeps.basecreep')
const targetfinder = require('./utils.targetfinder')

module.exports = class Transporter extends BaseCreep {
  constructor(creep) {
    super(creep)

    this.enableHurry = true
  }

  newJob() {
    const collectTargets = targetfinder.findCollectTargets(this.home, this.excludedTargets)
    const storeTargets = this.home.storeTargets.filter(s => !this.excludedTargets.includes(s.id))
    const drops = this.home.drops.filter(d => !this.excludedTargets.includes(d.id))

    if (this.empty()) {
      if(drops.length) {
        this.job = this.PICKUP
        this.target = this.pos.findClosestByPath(drops)
      }
      else if(collectTargets.length) {
        this.job = this.COLLECT_ENERGY
        this.target = this.pos.findClosestByPath(collectTargets)
      } else if(this.home.storage) {
        this.job = this.COLLECT_ENERGY
        this.target = this.home.storage
      }
    } else if(this.full()) {
      if(storeTargets.length) {
        this.job = this.STORE_ENERGY
        this.target = this.pos.findClosestByPath(storeTargets)
      }
    } else {
      const drpT = this.pos.findClosestByPath(drops)
      const rangeDrp = drpT ? this.pos.getRangeTo(drpT.pos) : Infinity
      const colT = this.pos.findClosestByPath(collectTargets)
      const rangeCol = colT ? this.pos.getRangeTo(colT.pos) : Infinity
      const strT = this.pos.findClosestByPath(storeTargets)
      const rangeStr = strT ? this.pos.getRangeTo(strT.pos) : Infinity
      if(rangeDrp < rangeStr) {
        this.job = this.PICKUP
        this.target = drpT
      } else if(rangeCol < rangeStr) {
        this.job = this.COLLECT_ENERGY
        this.target = colT
      } else {
        this.job = this.STORE_ENERGY
        this.target = strT
      }
    }

    // make sure this target is not chosen again in this tick
    if(this.target)
      this.excludedTargets.push(this.target.id)
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

  get excludedTargets() {
    if(!this._excludedTargets) {
      this._excludedTargets = this.home.creepTargetsByType(Transporter)
    }
    return this._excludedTargets
  }
}
