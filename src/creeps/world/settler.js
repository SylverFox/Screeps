const AbstractCreep = require('../abstractcreep')

module.exports = class Settler extends AbstractCreep {
  constructor(creep) {
    super(creep)
  }

  onNewJob() {
    if(!(Memory.nextBase && Memory.nextBase.roomName))
      return

    const room = Memory.nextBase.roomName

    if(this.room.name !== room) {
      this.job = this.SCOUT
      this.target = room
    } else if(!Game.rooms[room].controller.my) {
      this.job = this.CLAIM
      this.target = Game.rooms[room].controller
    } else if(this.full() && Game.rooms[room].myConstructionSites.length){
      this.job = this.BUILD
      this.target = Game.rooms[room].myConstructionSites[0]
    } else {
      this.job = this.HARVEST
      this.target = this.pos.findClosestByRange(Game.rooms[room].sources)
    }
  }

  static build(maxEnergy) {
    return this._creepFromSet([MOVE, CLAIM], [MOVE, MOVE, WORK, CARRY, CARRY], 9, maxEnergy)
  }
}
