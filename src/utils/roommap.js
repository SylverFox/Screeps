/**
 * Representation of a room, uses different maps internally, including a costmatrix
 */

module.exports = class Roommap {
  constructor() {
    this.reset()

    this.TYPES = [
      this.GROUND,
      this.WALL,
      this.FLUID,
      STRUCTURE_ROAD,
      STRUCTURE_SPAWN,
      STRUCTURE_EXTENSION,
      STRUCTURE_LINK,
      STRUCTURE_WALL,
      STRUCTURE_RAMPART,
      STRUCTURE_STORAGE,
      STRUCTURE_TOWER,
      STRUCTURE_OBSERVER,
      STRUCTURE_POWER_SPAWN,
      STRUCTURE_EXTRACTOR,
      STRUCTURE_TERMINAL,
      STRUCTURE_LAB,
      STRUCTURE_CONTAINER,
      STRUCTURE_NUKER
    ]
  }

  set(x, y, z, type) {
    this.cubemap[z][y][x] = this.TYPES.findIndex(t => t === type)

    let cost = 0
    if (type === this.WALL)
      cost = 255
    else if (type === STRUCTURE_ROAD)
      cost = 1
    else if (type === this.GROUND)
      cost = 2
    else if (type === STRUCTURE_CONTAINER)
      cost = 5 // Preferably not walk over container
    else if (type === STRUCTURE_RAMPART)
      cost = this.costmatrix.get(x, y)
    else
      cost = 255

    this.costmatrix.set(x, y, cost)
  }

  get(x, y, z) {
    return this.cubemap[z][y][x]
  }

  reset() {
    this.cubemap = []
    this.costmatrix = new PathFinder.CostMatrix()
    for (let z = 0; z < 10; z++) {
      this.cubemap[z] = []
      for (let y = 0; y < 50; y++) {
        this.cubemap[z][y] = []
        for (let x = 0; x < 50; x++) {
          this.cubemap[z][y][x] = 0
        }
      }
    }
  }

  import(mapString) {
    this.reset()
    for (let point of mapString) {
      if (point[3])
        this.cube[point[2]][point[1]][point[0]] = point[3]
    }
    return this
  }

  export(condense = true) {
    let out = []
    for (let z = 0; z < 10; z++) {
      for (let y = 0; y < 50; y++) {
        for (let x = 0; x < 50; x++) {
          const type = this.cubemap[z][y][x]
          if (!(condense && [this.WALL, this.GROUND, this.FLUID].includes(this.TYPES[type]))) {
            out.push([x, y, z, type])
          }
        }
      }
    }
    return out
  }

  // fluid fill the room using type cross or box
  fluidfill(type = 'box', z = 0) {
    const copy = this._copyMatrix(z)

    for (let y = 1; y < 49; y++) {
      for (let x = 1; x < 49; x++) {
        if (this.isGround(x, y, z) && this._surroundingHasFluid(x, y, z, type)) {
          copy[y][x] = this.TYPES.findIndex(t => t === this.FLUID)
        }
      }
    }

    this.cubemap[z] = copy
  }

  _copyMatrix(z = 0) {
    let copy = []
    for (let y = 0; y < 50; y++) {
      copy[y] = []
      for (let x = 0; x < 50; x++) {
        copy[y][x] = this.matrix[z][y][x]
      }
    }
    return copy
  }

  _surroundingHasFluid(x, y, type) {
    let surrounding = this.isFluid(x, y - 1) || this.isFluid(x - 1, y) || this.isFluid(x + 1, y) || this.isFluid(x, y + 1)
    if (type === 'box')
      surrounding = surrounding || this.isFluid(x - 1, y - 1) || this.isFluid(x + 1, y - 1) || this.isFluid(x - 1, y + 1) || this.isFluid(x + 1, y + 1)

    return surrounding > 0
  }

  removeFluid() {
    for (let y = 0; y < 50; y++) {
      for (let x = 0; x < 50; x++) {
        if (this.isFluid(x, y))
          this.set(x, y, this.GROUND)
      }
    }
  }

  isGround(arg1, arg2) {
    const x = arg1.x || arg1
    const y = arg1.y || arg2
    return this.TYPES[this.cubemap[0][y][x]] === this.GROUND
  }

  iswall(arg1, arg2) {
    const x = arg1.x || arg1
    const y = arg1.y || arg2
    return this.TYPES[this.cubemap[0][y][x]] === this.WALL
  }

  isFluid(arg1, arg2) {
    const x = arg1.x || arg1
    const y = arg1.y || arg2
    return this.TYPES[this.cubemap[0][y][x]] === this.FLUID
  }

  isWalkable(arg1, arg2) {
    // TODO
    const x = arg1.x || arg1
    const y = arg1.y || arg2
    return [STRUCTURE_ROAD, STRUCTURE_RAMPART, this.GROUND].includes(this.TYPES[this.matrix[y][x]])
  }

  adjacentFreeSpaces(arg1, arg2) {
    const x = arg1.x || arg1
    const y = arg1.y || arg2
    let spaces = []

    if (y > 6 && this.TYPES[this.matrix[y - 1][x]] === this.GROUND)
      spaces.push({ x: x, y: y - 1 })
    if (y < 44 && this.TYPES[this.matrix[y + 1][x]] === this.GROUND)
      spaces.push({ x: x, y: y + 1 })
    if (x > 6 && this.TYPES[this.matrix[y][x - 1]] === this.GROUND)
      spaces.push({ x: x - 1, y: y })
    if (x < 44 && this.TYPES[this.matrix[y][x + 1]] === this.GROUND)
      spaces.push({ x: x + 1, y: y })

    return spaces
  }

  // get coordinates of all structures in the map
  structures(excludedStructures = []) {
    let structures = []
    const exclude = [this.GROUND, this.WALL, this.FLUID].concat(excludedStructures)
    for (let y = 0; y < 50; y++) {
      for (let x = 0; x < 50; x++) {
        if (!exclude.includes(this.TYPES[this.matrix[y][x]]))
          structures.push({ x: x, y: y, type: this.TYPES[this.matrix[y][x]] })
      }
    }
    return structures
  }

  // get coordinates of all roads in the map
  roads() {
    let roads = []
    for (let y = 0; y < 50; y++) {
      for (let x = 0; x < 50; x++) {
        if (this.TYPES[this.matrix[y][x]] === STRUCTURE_ROAD)
          roads.push({ x, y })
      }
    }
    return roads
  }

  // returns the number of plain ground tiles
  ground() {
    let ground = 0
    for (let y = 0; y < 50; y++) {
      for (let x = 0; x < 50; x++) {
        if (this.isGround(x, y))
          ground++
      }
    }
    return ground
  }

  get GROUND() {
    return 'plain'
  }

  get WALL() {
    return 'wall'
  }

  get FLUID() {
    return 'fluid'
  }
}
