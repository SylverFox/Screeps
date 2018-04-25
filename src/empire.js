const sSettling = require('./strategies/settling')
const WorldMap = require('./utils/worldmap')

module.exports = class Empire {
  constructor() {
    this.worldmap = new WorldMap()
  }

  run() {
    this.worldmap.update()

    // handle each base
    let errs = []
    Object.keys(Game.rooms).map(r => Game.rooms[r]).forEach(r => {
      if (r.roomType === ROOM_TYPE_MY_BASE) {
        try {
          r.base.run(this)
        } catch(err) {
          errs.push(err)
        }
      }
    })
    errs.forEach(err => console.log(err, err.stack))

    if (Game.time % SETTLING_EXPANSION_INTERVAL === 0) {
      this.handleSettling()
    }
  }

  handleSettling() {
    this.worldmap.redistributeOutposts()

    if(Memory.nextBase) {
      if(!Memory.nextBase.spawnPos) {
        const newBase = sSettling.run()
        if(newBase) {
          Memory.nextBase = newBase
          Memory.rooms[newBase.roomName].firstSpawn = newBase.spawnPos
          Memory.rooms[newBase.roomName].roomType = ROOM_TYPE_MY_BASE
        }
      } else if(Game.rooms[Memory.nextBase.roomName] && Game.rooms[Memory.nextBase.roomName].controller &&
          Game.rooms[Memory.nextBase.roomName].controller.my && Game.rooms[Memory.nextBase.roomName].base.spawns.length) {
        delete Memory.nextBase
      } else {
        return
      }
    }

    const myBases = Object.keys(Game.rooms).map(r => Game.rooms[r].controller).filter(c => c && c.my)
    if(Game.gcl.level > myBases.length) {
      const newBase = sSettling.run()
      if(newBase) {
        Memory.nextBase = newBase
        Memory.rooms[newBase.roomName].firstSpawn = newBase.spawnPos
        Memory.rooms[newBase.roomName].roomType = ROOM_TYPE_MY_BASE
      }
    }
  }
}
