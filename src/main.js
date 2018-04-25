'use strict'

require('./prototypes/room')
require('./prototypes/source')
require('./prototypes/storage')
require('./prototypes/traveler')
require('./config')
require('./constants')

const Empire = require('./empire')
console.log('test')
exports.loop = function() {
  //handle dead screeps
  for(let i in Memory.creeps) {
    if(!Game.creeps[i]) {
      delete Memory.creeps[i]
    }
  }

  console.log(`Game time: ${Game.ticks}`)
  //Game.empire = new Empire()
  //Game.empire.run()
}
