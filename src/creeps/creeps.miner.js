const BaseCreep = require('./creeps.basecreep')

module.exports = class Miner extends BaseCreep {
  constructor(creep) {
    super(creep)
  }

  newJob() {
    const exclude = this.home.getCreepTargetsByType(Miner).map(s => s.id)
    const sources = this.home.baseSources.filter(s =>
      !exclude.includes(s.id) && s.container
    )
    if(sources.length) {
      this.job = this.HARVEST
      this.target = sources[0]
    }
  }

  handleJobOK() {
    if(this.container && !this.pos.isEqualTo(this.container.pos))
      this.moveTo(this.container.pos)

    return false // continue forever
  }

  handleEOL() {
    /*
    const ticksToSpawn = this.body.length * 3
    if(this.ticksToLive <= ticksToSpawn) {
      const creepInfo = {
        body: [MOVE, WORK, WORK, WORK, WORK, WORK],
        memory: {
          role: this.role,
          job: this.job,
          target: this.target.id
        }
      }
      if(!this.home.memory.prioSpawn)
        this.home.memory.prioSpawn = []

      this.home.memory.prioSpawn.push(creepInfo)
      return true
    }
    */
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
