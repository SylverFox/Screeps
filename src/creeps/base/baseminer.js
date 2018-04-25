const AbstractCreep = require('../abstractcreep')

module.exports = class BaseMiner extends AbstractCreep {
  constructor(creep) {
    super(creep)
    this.autojobs = [this.REPAIR]
  }

  onNewJob() {
    const exclude = this.home.getCreepTargetsByRole(this.role)
    const sources = this.home.outpostSources.filter(s =>
      !exclude.includes(s) && s.container
    )
    if(sources.length) {
      this.job = this.MINE
      this.target = sources[0]
    }

  }

  static build() {
    return [MOVE, MOVE, MOVE, CARRY, WORK, WORK, WORK, WORK, WORK]
  }
}
