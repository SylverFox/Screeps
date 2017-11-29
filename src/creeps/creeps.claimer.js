const BaseCreep = require('./creeps.basecreep')

module.exports = class Claimer extends BaseCreep {
  constructor(creep) {
    super(creep)
  }

  newJob() {
    const exclude = this.home.getCreepTargetsByType(Claimer)
    const target = this.home.roomsToClaim.filter(r =>
      !exclude.includes(r.controller)
    ).map(r => r.controller)

    if(target.length) {
      this.job = this.RESERVE
      this.target = target[0]
      return true
    }
    return false
  }

  handleJobOK() {
    return false
  }
}
