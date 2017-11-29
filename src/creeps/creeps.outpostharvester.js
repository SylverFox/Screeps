const BaseCreep = require('./creeps.basecreep')
const targetfinder = require('./utils.targetfinder')

module.exports = class OutpostHarvester extends BaseCreep {
  constructor(creep) {
    super(creep)

    this.HARVEST = 1
    this.STORE = 2
    this.BUILD = 3
  }

  performJob() {
    if(!this.job && !this.newJob()) return
    if(!this.target && !this.newTarget()) return

    let result
    if(this.job === this.HARVEST)
      result = this.harvest(this.target)
    else if(this.job === this.STORE)
      result = this.transfer(this.target, RESOURCE_ENERGY)
    else if(this.job === this.BUILD)
      result = this.build(this.target)

    if(result === OK) {
      if(this.full())
        this.newJob()
    } else if(result === ERR_NOT_IN_RANGE) {
      this.moveToTarget()
    } else if(result === ERR_FULL) {
      this.newJob()
    } else if(result === ERR_NOT_ENOUGH_RESOURCES) {
      this.newJob()
    } else if(result === ERR_INVALID_TARGET) {
      this.newTarget()
    } else {
      this.say(this.job+' '+result)
    }
  }

  newJob() {
    this.job = null
    this.target = null

    if(this.empty())
      this.job = this.HARVEST
    else if(this.room.find(FIND_MY_CONSTRUCTION_SITES).length)
      this.job = this.BUILD
    else
      this.job = this.STORE

    this.target = null
  }

  newTarget() {
    this.target = null

    if(this.job === this.HARVEST) {
      const exclude = this.home.getCreepTargetsByType(OutpostHarvester)
      this.target = this.home.sources.find(s => s.room === this.room)
      if(!this.target)
        this.target = this.home.sources.find(s => !exclude.includes(s))
      if(!this.target)
        this.target = this.home.sources.find(s => s)
    } else if(this.job === this.BUILD) {
      this.target = this.pos.findClosestByPath(this.room.find(FIND_MY_CONSTRUCTION_SITES))
    } else if(this.job === this.STORE) {
      this.target = targetfinder.findClosestStoringDeposit(this)
    }

    if(!this.target) {
      this.job = null
      this.say('zzz')
      return false
    } else {
      return true
    }
  }
}
