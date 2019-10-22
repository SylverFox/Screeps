/**
 * Holds information about the world that has been explored
 */
const Roominfo = require('./roominfo')

module.exports = class Worldmap {
  constructor() {
    this.worldmap = Memory.worldmap || {}
  }

  update() {
    Object.keys(Game.rooms).forEach(room => {
      if (this.worldmap[room]) {
        this.worldmap[room].lastseen = Game.time
      } else {
        this.worldmap[room] = Roominfo.all(room)
      }
    })
    Memory.worldmap = this.worldmap
    return `${Object.keys(this.worldmap).length} room(s) updated`
  }

  clean() {
    this.worldmap = {}
    Memory.worldmap = {}
    return this.update()
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
   * Retrieves the info from the room from the worldmap
   * @param {string} room the room name
   */
  roomInfo(room) {
    return this.worldmap[room] || {}
  }

  highestQualityBase() {
    let highestQualityBase = ''
    let maxBQI = 0
    for(const room in this.worldmap) {
      const r = this.worldmap[room]
      if(r.type !== ROOM_TYPE_MY_BASE && r.bqi > maxBQI) {
        maxBQI = r.bqi
        highestQualityBase = room
      }
    }
    return highestQualityBase
  }

  /**
   * retrieves my bases
   */
  get bases() {
    if (!this._bases) {
      let bases = []
      for (const r in this.worldmap) {
        if (this.worldmap[r].type === ROOM_TYPE_MY_BASE && Game.rooms[r]) {
          bases.push(Game.rooms[r])
        }
      }
      this._bases = bases
    }
    return this._bases
  }
}
