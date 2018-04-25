module.exports = class Map {
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

  // args: either x, y, type or {x, y}, type
  set(arg1, arg2, arg3) {
    const x = arg1.x || arg1
    const y = arg1.y || arg2
    const type = arg3 || arg2
    this.matrix[y][x] = this.TYPES.findIndex(t => t === type)
  }

  // args: either x, y or {x, y}
  get(arg1, arg2) {
    const x = arg1.x || arg1
    const y = arg1.y || arg2
    return this.TYPES[this.matrix[y][x]]
  }

  reset() {
    this.matrix = []
    for(let y = 0; y < 50; y++) {
      this.matrix[y] = []
      for(let x = 0; x < 50; x++) {
        this.matrix[y][x] = 0
      }
    }
  }

  import(mapString) {
    this.reset()
    const mapArray = JSON.parse(mapString)
    for(let point of mapArray) {
      this.matrix[point[1]][point[0]] = point[2]
    }
    return this
  }

  export(condense = true) {
    let out = []
    for(let y = 0; y < 50; y++) {
      for(let x = 0; x < 50; x++) {
        const type = this.matrix[y][x]
        if(!(condense && [this.WALL, this.GROUND, this.FLUID].includes(this.TYPES[type]))) {
          out.push([x, y, type])
        }
      }
    }
    return JSON.stringify(out)
  }

  print() {
    // TODO choose some awesome symbols
    const charTable = [
      ' ', '█', '=', '+', 'X', 'E', 'L', 'W', 'R',
      'S',
      'T',
      STRUCTURE_OBSERVER,
      STRUCTURE_POWER_SPAWN,
      'M',
      STRUCTURE_TERMINAL,
      STRUCTURE_LAB,
      'C',
      '☢'
    ]

    console.log('┌'+Array(149).join('─')+'┐')
    for(let y = 0; y < 50; y++) {
      console.log('│'+this.matrix[y].join('  ').replace(/\d+/g, match => charTable[match])+'│')
    }
    console.log('└'+Array(149).join('─')+'┘')
  }

  // fluid fill the room using type cross or box
  fluidfill(type = 'box') {
    const copy = this._copyMatrix()

    for(let y = 1; y < 49; y++) {
      for(let x = 1; x < 49; x++) {
        if(this.isGround(x, y) && this._surroundingHasFluid(x, y, type)) {
          copy[y][x] = this.TYPES.findIndex(t => t === this.FLUID)
        }
      }
    }

    this.matrix = copy
  }

  _copyMatrix() {
    let copy = []
    for(let y = 0; y < 50; y++) {
      copy[y] = []
      for(let x = 0; x < 50; x++) {
        copy[y][x] = this.matrix[y][x]
      }
    }
    return copy
  }

  _surroundingHasFluid(x, y, type) {
    let surrounding = this.isFluid(x, y-1) || this.isFluid(x-1, y) || this.isFluid(x+1, y) || this.isFluid(x, y+1)
    if(type === 'box')
      surrounding = surrounding || this.isFluid(x-1, y-1) || this.isFluid(x+1, y-1) || this.isFluid(x-1, y+1) || this.isFluid(x+1, y+1)

    return surrounding > 0
  }

  removeFluid() {
    for(let y = 0; y < 50; y++) {
      for(let x = 0; x < 50; x++) {
        if(this.isFluid(x, y))
          this.set(x, y, this.GROUND)
      }
    }
  }

  isGround(arg1, arg2) {
    const x = arg1.x || arg1
    const y = arg1.y || arg2
    return this.TYPES[this.matrix[y][x]] === this.GROUND
  }

  iswall(arg1, arg2) {
    const x = arg1.x || arg1
    const y = arg1.y || arg2
    return this.TYPES[this.matrix[y][x]] === this.WALL
  }

  isFluid(arg1, arg2) {
    const x = arg1.x || arg1
    const y = arg1.y || arg2
    return this.TYPES[this.matrix[y][x]] === this.FLUID
  }

  isWalkable(arg1, arg2) {
    const x = arg1.x || arg1
    const y = arg1.y || arg2
    return [STRUCTURE_ROAD, STRUCTURE_RAMPART, this.GROUND].includes(this.TYPES[this.matrix[y][x]])
  }

  adjacentFreeSpaces(arg1, arg2) {
    const x = arg1.x || arg1
    const y = arg1.y || arg2
    let spaces = []

    if(y > 6  && this.TYPES[this.matrix[y-1][x]] === this.GROUND)
      spaces.push({x: x, y: y-1})
    if(y < 44 && this.TYPES[this.matrix[y+1][x]] === this.GROUND)
      spaces.push({x: x, y: y+1})
    if(x > 6  && this.TYPES[this.matrix[y][x-1]] === this.GROUND)
      spaces.push({x: x-1, y: y})
    if(x < 44 && this.TYPES[this.matrix[y][x+1]] === this.GROUND)
      spaces.push({x: x+1, y: y})

    return spaces
  }

  // get coordinates of all structures in the map
  structures(excludedStructures = []) {
    let structures = []
    const exclude = [this.GROUND, this.WALL, this.FLUID].concat(excludedStructures)
    for(let y = 0; y < 50; y++) {
      for(let x = 0; x < 50; x++) {
        if(!exclude.includes(this.TYPES[this.matrix[y][x]]))
          structures.push({x: x, y: y, type: this.TYPES[this.matrix[y][x]]})
      }
    }
    return structures
  }

  // get coordinates of all roads in the map
  roads() {
    let roads = []
    for(let y = 0; y < 50; y++) {
      for(let x = 0; x < 50; x++) {
        if(this.TYPES[this.matrix[y][x]] === STRUCTURE_ROAD)
          roads.push({x, y})
      }
    }
    return roads
  }

  // returns the number of plain ground tiles
  ground() {
    let ground = 0
    for(let y = 0; y < 50; y++) {
      for(let x = 0; x < 50; x++) {
        if(this.isGround(x, y))
          ground++
      }
    }
    return ground
  }

  costMatrix() {
    const cm = new PathFinder.CostMatrix()
    for(let y = 0; y < 50; y++) {
      for(let x = 0; x < 50; x++) {
        const type = this.TYPES[this.matrix[y][x]]
        if(type === this.WALL)
          cm.set(x, y, 255)
        else if(type === STRUCTURE_ROAD || type === STRUCTURE_RAMPART)
          cm.set(x, y, 1)
        else if(type === this.GROUND)
          cm.set(x, y, 2)
        else
          cm.set(x, y, 255) // other structures
      }
    }
    return cm
  }

  get GROUND() {
    return 'ground'
  }

  get WALL() {
    return 'wall'
  }

  get FLUID() {
    return 'fluid'
  }
}
