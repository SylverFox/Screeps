const BaseCreep = require('./creeps.basecreep')
const targetfinder = require('./utils.targetfinder')

module.exports = class Mechanic extends BaseCreep {
  constructor(creep) {
    super(creep)

    this.GATHER = 1
    this.UPGRADE = 2
    this.BUILD = 3
    this.REPAIR = 4
  }

  performJob() {
    if(!this.job && !this.newJob()) return
    if (!this.target && !this.newTarget()) return

    let result
    if (this.job === this.GATHER) {
      if(this.target instanceof RoomPosition)
        this.moveToTarget()
      result = this.withdraw(this.target, RESOURCE_ENERGY)
    } else if (this.job === this.UPGRADE)
      result = this.upgradeController(this.target)
    else if (this.job === this.BUILD)
      result = this.build(this.target)
    else if (this.job === this.REPAIR)
      result = this.repair(this.target)

    //this.say(result)

    if(result === OK) {
      this.newJob()

      if(this.empty() || this.full())
        this.newJob()
    } else if(result === ERR_NOT_IN_RANGE) {
      this.moveToTarget(this.target, this.job === this.GATHER ? 1 : 3)
    } else if(result === ERR_FULL) {
      this.newJob()
    } else if(result === ERR_NOT_ENOUGH_RESOURCES) {
      if(this.job === this.GATHER)
        this.newTarget()
      else
        this.newJob()
    } else if(result === ERR_INVALID_TARGET) {
      this.newTarget()
    } else {
      this.say(this.job+' '+result)
    }

  }

  newJob(job) {
    this.job = null
    this.target = null

    if (this.empty())
      this.job = this.GATHER
    else
      this.job = this.findBestJob()

    return !!this.job
  }

  findBestJob() {
    const mechs = this.home.creepJobsByType(Mechanic)
    const total = mechs.length + 1
    const upgraders = mechs.filter(m => m === this.UPGRADE).length
    const builders = mechs.filter(m => m === this.BUILD).length
    const repairers = mechs.filter(m => m === this.REPAIR).length
    //console.log(upgraders, builders, repairers)
    if (upgraders === 0)
      return this.UPGRADE
    else if (this.home.myConstructionSites.length && builders < total * 0.75)
      return this.BUILD
    else if (this.home.damagedStructures.length && repairers < total * 0.25)
      return this.REPAIR
    else
      return this.UPGRADE
  }

  newTarget() {
    if(this.job === this.GATHER) {
      this.target = targetfinder.findClosestRetrievingDeposit(this)
    } else if(this.job === this.UPGRADE)
      this.target = this.home.controller
    else if(this.job === this.BUILD) {
      let target = this.pos.findClosestByPath(this.home.myConstructionSites)
      if(!target && this.home.myConstructionSites.length)
        target = this.home.myConstructionSites[0]
      this.target = target
    } else if(this.job === this.REPAIR)
      this.target = this.pos.findClosestByPath(this.home.damagedStructures)

    if(!this.target) {
      this.job = null
      this.say('zzz')
      return false
    } else {
      return true
    }
  }
}
