const AbstractCreep = require('../abstractcreep')

module.exports = class HomeTransporter extends AbstractCreep {
  constructor(creep) {
    super(creep)
  }

  performJob() {
    if(this.memory.job === 'collect') {
      const target = Game.getObjectById(this.memory.collectTarget)
      if(this.pos.inRangeTo(target, 1)) {
        const res = this.withdraw(target, RESOURCE_ENERGY)
        if(res === OK) {
          this.job = 'store'
        } else {
          this.job = 'store'
          this.say(res)
        }
      } else {
        this.travelTo(target)
      }
    } else if(this.memory.job === 'store') {
      const target = Game.getObjectById(this.memory.storeTarget)
      if(this.pos.inRangeTo(target, 1)) {
        const res = this.transfer(target, RESOURCE_ENERGY)
        if(res === OK) {
          this.job = 'collect'
        } else {
          this.job = 'collect'
          this.say(res)
        }
      } else {
        this.travelTo(target)
      }
    } else {
      if(this.room.storage)
        this.memory.storeTarget = this.room.storage.id
      else
        this.memory.storeTarget = this.home.spawns[0].id

      const exclude = this.home.creeps.filter(c => c.role === this.role).map(
        c => c.memory.collectTarget
      ).filter(c => c)

      const container = this.home.sources.map(s => s.container).find(s => s && !exclude.includes(s.id))
      if(container) {
        this.memory.collectTarget = container.id
      }

      if(this.memory.storeTarget && this.memory.collectTarget)
        this.memory.job = 'collect'
    }
  }



  static build(maxEnergy) {
    return this._creepFromSet([], [MOVE, CARRY, CARRY], 6, maxEnergy)
  }
}
