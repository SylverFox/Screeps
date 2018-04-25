Object.defineProperty(Source.prototype, 'memory', {
  get: function() {
    if(!Memory.sources) {
      Memory.sources = {}
    }
    if(!Memory.sources[this.id]) {
      Memory.sources[this.id] = {}
    }
    return Memory.sources[this.id]
  },
  set: function(value) {
    if (!Memory.sources) {
      Memory.sources = {}
    }
    Memory.sources[this.id] = value;
  },
  configurable: true,
})

Object.defineProperty(Source.prototype, 'container', {
  get: function() {
    if (!this._container) {
      if(!this.memory.container) {
        const container = this.pos.findInRange(FIND_STRUCTURES, 1).filter(
          s => s.structureType === STRUCTURE_CONTAINER
        )
        if(container.length)
          this.memory.container = container[0].id
      }
      this._container = Game.getObjectById(this.memory.container)
    }
    return this._container
  },
  enumerable: false,
  configurable: true
})

Object.defineProperty(Source.prototype, 'freeSpaces', {
  get: function() {
    if (!this._freeSpaces) {
      if (!this.memory.freeSpaces) {
        this.memory.freeSpaces = this.room.lookForAtArea(
          LOOK_TERRAIN,
          this.pos.y - 1, this.pos.x - 1, this.pos.y + 1, this.pos.x + 1,
          true
        ).filter(t => t.terrain !== 'wall').length
      }
      this._freeSpaces = this.memory.freeSpaces
    }
    return this._freeSpaces
  },
  enumerable: false,
  configurable: true
})
