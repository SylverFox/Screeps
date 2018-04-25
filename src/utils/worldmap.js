/**
 * Holds information about the world that has been explored
 */

module.exports = class Worldmap {
  TOP_MASK = 0b001
  RIGHT_MASK = 0b0010
  BOTTOM_MASK = 0b0100
  LEFT_MASK = 0b1000

  constructor() {
    // import from memory
    this.worldmap = Memory.worldmap || {}
    // update world map
    this.update()
    // store in memory
    Memory.worldmap = this.worldmap
  }

  /**
   * Updates the worldmap from available rooms
   */
  update() {
    console.log(Object.keys(this.worldmap).length)
    Object.keys(Game.rooms).map(r => Game.rooms[r]).forEach(room => {
      if (this.worldmap[room.name]) {
        this.worldmap[room.name].lastseen = Game.time
      } else {
        this.worldmap[room.name] = {
          type: this.roomType(room.name),
          exits: this.findExits(room.name),
          lastseen: Game.time
        }
      }
    })
    console.log(JSON.stringify(this.worldmap))
  }

  /**
   * Retrieves the type of the room
   * @param room Name of the room
   */
  roomType(room) {
    let type = ROOM_TYPE_UKNOWN

    if (this.worldmap[room] && this.worldmap[room].type) {
      type = this.worldmap[room].type
    } else if (Game.rooms[room]) {
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

  /**
   * Concerts a room by its name to a world coordinate example: 'W8N3' -> (-9, 3)
   * The room 'E0N0' is equivalent to (0, 0), 'W0S0' is equivalent to (-1, -1)
   * @param roomName Room name in the form 'W8N3'
   */
  roomNameToWorldCoord(room) {
    const match = /(W|E)(\d+)(N|S)(\d+)/.exec(room)
    if (!match || match.length !== 4) {
      throw new Error('Invalid room name')
    }
    const x = match[1] === 'E' ? parseInt(match[2]) : parseInt(match[2]) * -1 - 1
    const y = match[3] === 'N' ? parseInt(match[4]) : parseInt(match[4]) * -1 - 1
    return { x, y }
  }

  /**
   * Converts a world coordinate to its room number, see roomNameToWorldCoord
   * @param x x world coordinate
   * @param y y world coordinate
   */
  worldCoordToRoomName(x, y) {
    const horizontal = x >= 0 ? 'E' + x : 'W' + (x * -1 - 1)
    const vertical = y >= 0 ? 'N' + y : 'S' + (y * -1 - 1)
    return horizontal + vertical
  }

  /**
   * Finds the exits of the room
   * @param room Room name
   */
  findExits(room) {
    let exits = 0
    const e = Game.map.describeExits(room)

    if (e[TOP])
      exits |= Worldmap.TOP_MASK
    if (e[RIGHT])
      exits |= Worldmap.RIGHT_MASK
    if (e[BOTTOM])
      exits |= Worldmap.BOTTOM_MASK
    if (e[LEFT])
      exits |= Worldmap.LEFT_MASK

    return exits
  }
}


