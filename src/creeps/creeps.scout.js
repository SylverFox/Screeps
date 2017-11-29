const BaseCreep = require('./creeps.basecreep')

module.exports = class Scout extends BaseCreep {
  constructor(creep) {
    super(creep)
  }

  newJob() {
    const exclude = this.home.getCreepTargetsByType(Scout)
    const target = this.home.roomsToScout.find(r => !exclude.includes(r))
    if(target) {
      this.job = this.SCOUT
      this.target = target
    }
  }

  handleJobOK() {
    const targetPos = new RoomPosition(25, 25, this.target)
    const result = this.moveTo(targetPos, {reusePath: 25})

    if(
      this.pos.inRangeTo(targetPos, 5) ||
      (result === ERR_NO_PATH && this.target === this.pos.roomName)
    ) {
      this.say('deploy')
      delete this.memory.target
      delete this.memory.role
    }
  }
}
