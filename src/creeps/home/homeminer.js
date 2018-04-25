const AbstractCreep = require('../abstractcreep')

module.exports = class HomeMiner extends AbstractCreep {
  constructor(creep) {
    super(creep)

    this.MINE = 'mine'
    this.MOVE = 'move'
  }

  performJob() {
    console.log(this.job, this.memory.sourceTarget, this.memory.containerTarget)
    //if(!(this.job && this.memory.sourceTarget && this.memory.containerTarget))
      //this.newJob()

    if(this.job === this.MINE) {
      const target = Game.getObjectById(this.memory.sourceTarget)
      console.log(this.memory.sourceTarget, target)
      const res = this.harvest(target)
      this.say(res)
    } else if(this.job === this.MOVE) {
      const target = Game.getObjectById(this.memory.containerTarget)
      if(this.pos.isEqualTo(target.pos)) {
        this.job === this.MINE
      } else {
        this.travelTo(target, 0)
      }
    } else {
      this.newJob()
    }
  }

  newJob() {
    const exclude = this.home.creeps.filter(c => c.role === this.role).map(c => c.sourceTarget)
    const target = this.home.sources.find(s => !exclude.includes(s.id) && s.container)
    console.log(exclude, target)
    if(target) {
      this.job = this.MOVE
      this.memory.sourceTarget = target.id
      this.memory.containerTarget = target.container.id
    }
  }

  static build() {
    return [MOVE, WORK, WORK, WORK, WORK, WORK]
  }
}
