const sSettling = require('./strategies/settling')


module.exports = class Empire {
  constructor() {
  }

  run() {
    // handle each base
    let errs = []
    Game.worldmap.bases.forEach(r => {
      try {
        r.base.run()
      } catch (err) {
        errs.push(err)
      }
    })
    errs.forEach(err => console.log(err, err.stack))

    if (Game.time % SETTLING_EXPANSION_INTERVAL === 0) {
      this.handleSettling()
    }
  }

  handleSettling() {
    // redistribute outposts
    //Game.worldmap.redistributeOutposts()
    return
    // massive TODO

    if (Memory.nextbase) {
      // expand to this base

      // check if we have vision, otherwise fix that

      // check if the controller is ours

      // check if the spawn has been build

      // update everything and delete Memory.nextbase

      if (!Memory.nextBase.spawnPos) {
        const newBase = sSettling.run()
        if (newBase) {
          Memory.nextBase = newBase
          Memory.rooms[newBase.roomName].firstSpawn = newBase.spawnPos
          Memory.rooms[newBase.roomName].roomType = ROOM_TYPE_MY_BASE
        }
      } else if (Game.rooms[Memory.nextBase.roomName] && Game.rooms[Memory.nextBase.roomName].controller &&
        Game.rooms[Memory.nextBase.roomName].controller.my && Game.rooms[Memory.nextBase.roomName].base.spawns.length) {
        delete Memory.nextBase
      } else {
        return
      }
    } else if (Game.gcl.level > Game.worldmap.bases.length) {
      // no new base in sight and we can construct another base
      let nextbase = Game.worldmap.highestQualityBase()
      Memory.nextbase = {name: nextbase}
      //const newBase = sSettling.run()
      //if (newBase) {
      //  Memory.nextBase = newBase
      //  Memory.rooms[newBase.roomName].firstSpawn = newBase.spawnPos
      //  Memory.rooms[newBase.roomName].roomType = ROOM_TYPE_MY_BASE
      //}
    }
  }
}
