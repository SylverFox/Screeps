const BaseCreep = require('./creeps.basecreep')

module.exports = class Miner extends BaseCreep {
  constructor(creep) {
    super(creep)
  }

  newJob() {
    const exclude = this.home.creepTargetsByType(Miner).map(s => s.id)
    const sources = this.home.sources.filter(s =>
      !exclude.includes(s.id) && s.container
    )
    if(sources.length) {
      this.job = this.HARVEST
      this.target = sources[0]
      return true
    }
    return false
  }

  handleJobOK() {
    if(!this.pos.isEqualTo(this.container.pos))
      this.moveTo(this.container.pos)

    return false // continue forever
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
