const AbstractCreep = require('../abstractcreep')

module.exports = class BaseClaimer extends AbstractCreep {
  constructor(creep) {
    super(creep)
  }

  onNewJob() {
    const exclude = this.home.getCreepTargetsByRole(this.role)
    const rooms = this.home.roomsToClaim.filter(r =>
      !exclude.includes(r)
    )

    if(rooms.length) {
      this.job = this.RESERVE
      this.target = rooms[0]
    }
  }

  static build() {
    return [CLAIM, CLAIM, MOVE, MOVE]
  }
}
