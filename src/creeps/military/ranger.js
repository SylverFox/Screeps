const AbstractCreep = require('../abstractcreep')

module.exports = class Ranger extends AbstractCreep {
  constructor(creep) {
    super(creep)
  }

  performJob() {
    if(!this.target && !this.newTarget()) return

    let result
    if(this.target.my) {
      result = this.heal(this.target)
    } else {
      result = this.rangedAttack(this.target)
    }

    if(result === OK) {
      // kite
      if(this.hits < this.hitsMax)
        this.heal(this)

      const fleePath = PathFinder.search(this.pos, {pos: this.target.pos, range: 5}, {flee: true}).path
      this.moveByPath(fleePath)

    } else if(result === ERR_NOT_IN_RANGE) {
      this.moveTo(this.target)
    } else if(result === ERR_INVALID_TARGET) {
      this.target = null
    } else {
      this.say(result)
    }
  }

  newTarget() {
    if(this.home.hostileCreeps.length) {
      this.target = this.home.hostileCreeps[0]
    } else {
      const crp = this.room.find(FIND_MY_CREEPS).find(c => c.hits < c.hitsMax)
      if(crp) {
        this.target = crp
      }
    }

    if(this.target) {
      return true
    } else {
      this.say(EMOJI_SLEEPING)
      return false
    }
  }

  static build() {
    return [TOUGH, MOVE, MOVE, MOVE, RANGED_ATTACK, HEAL]
  }
}
