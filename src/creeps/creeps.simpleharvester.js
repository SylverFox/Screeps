const BaseCreep = require('./creeps.basecreep')
const targetfinder = require('./utils.targetfinder')

module.exports = class SimpleHarvester extends BaseCreep {
  constructor(creep) {
    super(creep)

    this.HARVEST = 'harvest'
    this.STORE = 'store'
    this.BUILD = 'build'
  }

  performJob() {
    if(!this.job && !this.newJob(this)) return
    if(!this.target && !this.newTarget()) return

    let result
    if(this.job === this.HARVEST) {
      result = this.harvest(this.target)
    } else if(this.job === this.STORE) {
      result = this.transfer(this.target, RESOURCE_ENERGY)
    } else if(this.job === this.BUILD) {
      result = this.build(this.target)
    }

    if(result === OK) {
      if(this.full() || this.empty())
        this.newJob()
    } else if(result === ERR_NOT_IN_RANGE) {
      const moveResult = this.moveToTarget()
      if(moveResult === this.UNABLE_TO_MOVE)
        this.newTarget()
    } else if(result === ERR_FULL || result === ERR_NOT_ENOUGH_RESOURCES || result === ERR_INVALID_TARGET) {
      this.newJob()
    } else {
      this.say(result)
    }
  }

  newJob() {
    this.job = null
    this.target = null

    if(this.empty())
      this.job = this.HARVEST
    else if(targetfinder.findClosestStoringDeposit(this)){
      this.job = this.STORE
    } else {
      this.job = this.BUILD
    }
    return true
  }

  newTarget() {
    this.target = null
    if(this.job === this.HARVEST) {
      this.target = this.pos.findClosestByPath(this.home.sources)
    } else if(this.job === this.STORE) {
      this.target = targetfinder.findClosestStoringDeposit(this)
    } else if(this.job === this.BUILD) {
      this.target = this.pos.findClosestByPath(this.home.myConstructionSites)
    }

    if(!this.target && !this.newJob()) {
      this.say('zzz')
      return false
    } else {
      return true
    }
  }
}
