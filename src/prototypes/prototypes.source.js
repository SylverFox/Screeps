Object.defineProperty(Source.prototype, 'container', {
  get: function() {
    if (!this._container) {
      const containers = this.room.find(FIND_STRUCTURES).filter(s =>
        s.structureType === STRUCTURE_CONTAINER && s.pos.isNearTo(this)
      )
      if (containers.length)
        this._container = containers[0]
    }
    return this._container
  },
  enumerable: false,
  configurable: true
})

Object.defineProperty(Source.prototype, 'freeSpaces', {
  get: function() {
    if(!this._freeSpaces) {
      this._freeSpaces = this.room.lookForAtArea(
        LOOK_TERRAIN,
        this.pos.y - 1, this.pos.x - 1, this.pos.y + 1, this.pos.x + 1,
        true
      ).filter(t => t.terrain !== 'wall').length
    }
    return this._freeSpaces
  },
  enumerable: false,
  configurable: true
})
