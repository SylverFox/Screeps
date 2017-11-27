const BaseCreep = require('./creeps.basecreep')

module.exports = class Miner extends BaseCreep {
  constructor(creep) {
    super(creep)

    this.MINING = 'mining'
  }

  performJob(newJobCallback) {
    if(!this.job) {
      this.getMineTarget()
      if(!this.job)
        return
    }

    // move to source and container if possible
    const moveResult = this.container ? this.moveToTarget(this.container, 0) :
      this.moveToTarget(this.target)
    if((moveResult & this.TARGET_IN_RANGE) === this.TARGET_IN_RANGE) {
      this.harvest(this.target)
    }
  }

  getMineTarget() {
    const exclude = this.home.creeps.filter(c => c instanceof Miner).map(c => c.memory.target)
    const sources = this.home.sources.filter(s => !exclude.includes(s.id) && s.container)
    if(sources.length) {
      this.job = this.MINING
      this.target = sources[0]
    }
  }

  get container() {
    if(!this._container) {
      if(!this.memory.container) {
        const cont = Game.getObjectById(this.memory.target).container
        if(cont)
          this.memory.container = cont.id
      }
      this._container = Game.getObjectById(this.memory.container)
    }
    return this._container
  }
}
