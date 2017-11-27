const sOutpostExpansion = require('./strategy.outpost.expansion')

module.exports = class Outpost extends Room {
  constructor(room) {
    super(room.name)
    Object.assign(this, room)
  }

  run() {
    if (Game.time % OUTPOST_EXPANSION_INTERVAL === 0)
      this.handleOutpostExpansion()
  }

  handleOutpostExpansion() {
    const constructionJobs = sOutpostExpansion.run(this)
    if (constructionJobs && constructionJobs.length) {
      for (let job of constructionJobs) {
        const result = new RoomPosition(...job.pos).createConstructionSite(job.type)
        if (result === OK)
          console.log('new construction job at (', job.pos[0], ',', job.pos[1], ') of type ', job.type)
        else
          console.log('new construction job', job.type, 'failed at (', job.pos[0], ',', job.pos[1], '), reason: ' + result)
        }
    }
  }

  get constructionSites() {
    if(!this._constructionSites)
      this._constructionSites = this.find(FIND_MY_CONSTRUCTION_SITES)
    return this._constructionSites
  }

  get bases() {
    if(!this._bases) {
      const exits = Game.map.describeExits(this.name)
      this._bases = Object.keys(exits).map(e => Game.rooms[exits[e]]).filter(r =>
        r && r.base
      ).map(r => r.base)
    }
    return this._bases
  }
}
