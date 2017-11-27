require('./prototypes')
require('./constants')

const Base = require('./base')
const sSettling = require('./strategy.settling')

exports.loop = function() {
  //handle dead screeps
  for(let i in Memory.creeps) {
    if(!Game.creeps[i]) {
      // creep has died
      delete Memory.creeps[i]
    }
  }

  // handle each base
  let errs = []
  Object.keys(Game.rooms).forEach(r => {
    if (Game.rooms[r].roomType === ROOM_TYPE_MY_BASE) {
      try {
        Game.rooms[r].base.run()
      } catch(err) {
        errs.push(err)
      }
    } else if(Game.rooms[r].roomType === ROOM_TYPE_MY_OUTPOST) {
      try {
        Game.rooms[r].outpost.run()
      } catch(err) {
        errs.push(err)
      }
    }
  })
  errs.forEach(err => console.log(err, err.stack))

  if (Game.time % SETTLING_EXPANSION_INTERVAL === 0)
    handleSettling()
}

function handleSettling() {
  if(Memory.nextBase) {
    if(!Game.rooms[Memory.nextBase.roomName].controller.my) {
      return
    } else {
      delete Memory.nextBase
    }
  }
  const myBases = Object.keys(Game.rooms).map(r => Game.rooms[r].controller).filter(c => c && c.my)
  if(Game.gcl.level > myBases.length) {
    const newBase = sSettling.run()
    if(newBase) {
      Memory.nextBase = newBase
      Game.rooms[newBase.roomName].memory.firstSpawn = newBase.spawnPos
    }
  }
}
