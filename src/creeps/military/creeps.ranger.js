const BaseCreep = require('creeps.basecreep')

module.exports = class Ranger extends BaseCreep {
  constructor(creep) {
    super(creep)
  }

  performJob() {
    if(!this.target && !this.newTarget()) return

    const result = this.rangedAttack(target)

    if(result === OK) {
      // kite
      this.heal(this)
      const fleePath = PathFinder.search(this.pos, {pos: this.target.pos, range: 1}, {flee: true})
      this.moveByPath(fleePath)

    }
    if(result === ERR_NOT_IN_RANGE) {
      this.moveToTarget()
    } else {
      this.say(result)
    }
  }

  newTarget() {
    if(this.home.hostileCreeps.length) {
      this.target = this.home.hostileCreeps[0]
    }

    if(this.target) {
      return true
    } else {
      this.say('zzz')
      return false
    }
  }
}
