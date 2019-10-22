'use strict'

require('./prototypes/room')
require('./prototypes/source')
require('./prototypes/storage')
require('./config')
require('./constants')

const Worldmap = require('./utils/worldmap')
const Empire = require('./empire')

exports.loop = function () {
  //handle dead screeps
  for (let i in Memory.creeps) {
    if (!Game.creeps[i]) {
      delete Memory.creeps[i]
    }
  }

  Game.worldmap = new Worldmap()
  Game.worldmap.update()

  Game.empire = new Empire()
  Game.empire.run()
}
