const BaseCreep = require('./creeps.basecreep')

module.exports = class Scout extends BaseCreep {
  constructor(creep) {
    super(creep)
  }

  performJob(creep) {
    this.scout()
  }

  scout() {
    if(!this.target) {
      const exclude = this.home.creeps.filter(c => c instanceof Scout)
        .map(c => c.memory.target)
      const target = this.home.roomsToScout.find(r => !exclude.includes(r))
      if (!target) {
        this.say('zzz')
        return
      }
      this.target = target
    }

    const result = this.moveTo(this.target, {reusepath: 10})

    if(result === OK) {
      if(this.pos.isEqualTo(this.target)) {
        this.deploy()
      }
    } else if(result === ERR_NO_PATH) {
      if(this.room.name === this.target.roomName) {
        // arrived at the room and no path to the middle, deploy here
        this.deploy()
      }
    } else if(result !== OK) {
      this.say(result)
    }
  }

  deploy() {
    this.say('deploy')
    delete this.memory.target
    delete this.memory.role
  }

  get target() {
    if(!this._target && this.memory.target)
      this._target = new RoomPosition(25, 25, this.memory.target)
    return this._target
  }

  set target(target) {
    this.memory.target = target
    this._target = new RoomPosition(25, 25, target)
  }
}
