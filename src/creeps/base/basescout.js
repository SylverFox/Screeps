const AbstractCreep = require('../abstractcreep')

module.exports = class BaseScout extends AbstractCreep {
  constructor(creep) {
    super(creep)
  }

  onNewJob() {
    let target = Game.empire.worldmap.findClosestFoggedRoom(this.room.name)
    if(!target && Memory.nextBase) {
      target = Memory.nextBase.roomName
    }

    if(target) {
      this.job = this.SCOUT
      this.target = target
    }
  }

  static build() {
    return [MOVE]
  }
}
