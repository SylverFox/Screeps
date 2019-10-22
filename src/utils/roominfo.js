/**
 * Retrieves info about a room
 */
exports.TOP_MASK = 0b001
exports.RIGHT_MASK = 0b0010
exports.BOTTOM_MASK = 0b0100
exports.LEFT_MASK = 0b1000

exports.all = function () {
  return {
    type: exports.roomType(room),
    exits: exports.findExits(room),
    sources: exports.findSources(room),
    mineral: exports.findMineral(room),
    bqi: exports.baseQualityIndex(room),
    lastseen: Game.time
  }
}

exports.findExits = function (room) {
  let exits = 0
  const e = Game.map.describeExits(room)
  if(e) {
    if (e[TOP])
    exits |= this.TOP_MASK
  if (e[RIGHT])
    exits |= this.RIGHT_MASK
  if (e[BOTTOM])
    exits |= this.BOTTOM_MASK
  if (e[LEFT])
    exits |= this.LEFT_MASK
  }
  return exits
}

exports.findSources = function (room) {
  if(Game.rooms[room])
    return Game.rooms[room].find(FIND_SOURCES).map(s => s.id)
}

exports.findMineral = function (room) {
  if(Game.rooms[room])
    return Game.rooms[room].find(FIND_MINERALS).map(m => m.id).shift()
}

exports.roomType = function (room) {
  let type = ROOM_TYPE_UKNOWN
  if (Game.rooms[room]) {
    const r = Game.rooms[room]
    if (!r.controller && r.sources.length) {
      type = ROOM_TYPE_SOURCE_KEEPERS
    } else if (!r.controller) {
      type = ROOM_TYPE_EMPTY
    } else if (r.controller.my) {
      type = ROOM_TYPE_MY_BASE
    } else if (r.controller.owner) {
      type = ROOM_TYPE_HOSTILE_BASE
    } else if (r.controller.reservation && r.controller.reservation.username === USERNAME) {
      type = ROOM_TYPE_MY_OUTPOST
    } else if (r.controller.reservation && r.controller.reservation.username !== USERNAME) {
      type = ROOM_TYPE_HOSTILE_OUTPOST
    } else if (r.sources.length) {
      type = ROOM_TYPE_FARM
    }
  }
  return type
}

exports.baseQualityIndex = function(room) {
  // TODO: implement algorithm to determine if settling here is usefull
  return 1
}