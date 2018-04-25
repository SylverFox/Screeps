const sOutpostExpansion = require('./strategies/outpost.expansion')

module.exports = class Outpost extends Room {
  constructor(room) {
    super(room.name)
    Object.assign(this, room)
  }

  run(base) {
    this.ownedbase = base

    if (Game.time % OUTPOST_EXPANSION_INTERVAL === 0) {
      this.handleOutpostExpansion()
    }

    this.sources.filter(s => s.container).forEach(
      s => this.visual.text(s.container.store[RESOURCE_ENERGY], s.container.pos)
    )
    this.structures.filter(s => s.hits < s.hitsMax * 0.9).forEach(
      s => this.visual.circle(s.pos, {fill: 'transparent', stroke: 'red'})
    )
  }

  handleOutpostExpansion() {
    this.memory.constructionCompleted = false
    const constructionJobs = sOutpostExpansion.run(this)

    if (constructionJobs && constructionJobs.length) {
      for (let job of constructionJobs) {
        const result = job.pos.createConstructionSite(job.type)
        if (result === OK)
          console.log('new construction job at (', job.pos.x, ',', job.pos.y, ') of type ', job.type)
        else
          console.log('new construction job', job.type, 'failed at (', job.pos.x, ',', job.pos.y, '), reason: ' + result)
        }
    } else {
      this.memory.constructionCompleted = true
    }
  }
}
