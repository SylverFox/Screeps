Object.defineProperty(Room.prototype, 'roomType', {
  get: function() {
    if(!this._roomType) {
      if(!this.memory.roomType) {
        if(!Game.rooms[this.name])
          this._roomType = ROOM_TYPE_FOGGED
        else if(!this.controller)
          this.memory.roomType = ROOM_TYPE_EMPTY
        else if(this.controller.my)
          this.memory.roomType = ROOM_TYPE_MY_BASE
        else if(this.controller.owner)
          this.memory.roomType = ROOM_TYPE_HOSTILE_BASE
        else if(this.controller.reservation && this.controller.reservation.username === USERNAME)
          this._roomType = ROOM_TYPE_MY_OUTPOST
        else if(this.controller.reservation && this.controller.reservation.username !== USERNAME)
          this._roomType = ROOM_TYPE_HOSTILE_OUTPOST
        else if(this.sources.length)
          this._roomType = ROOM_TYPE_FARM
        else
          console.log('uknown room type')
      }
      if(this.memory.roomType)
        this._roomType = this.memory.roomType
    }
    return this._roomType
  },
  enuerable: false,
  configurable: true
})

Object.defineProperty(Room.prototype, 'sources', {
  get: function() {
    if (!this._sources) {
      if (!this.memory.sourceIds) {
        this.memory.sourceIds = this.find(FIND_SOURCES).map(s => s.id)
      }
      this._sources = this.memory.sourceIds.map(id => Game.getObjectById(id))
    }
    return this._sources;
  },
  enumerable: false,
  configurable: true
})

Object.defineProperty(Room.prototype, 'mineral', {
  get: function() {
    if(!this._mineral) {
      if(!this.memory.mineralId) {
        const mineral = this.find(FIND_MINERALS).map(s => s.id)
        if(mineral.length)
          this.memory.mineralId = mineral[0]
      }
      this._mineral = Game.getObjectById(this.memory.mineralId)
    }
    return this._mineral
  },
  enumerable: false,
  configurable: true
})

Object.defineProperty(Room.prototype, 'base', {
  get: function() {
    if (!this._base && this.roomType === ROOM_TYPE_MY_BASE)
      this._base = new (require('./base'))(this)
    return this._base
  },
  enumerable: false,
  configurable: true
})

Object.defineProperty(Room.prototype, 'outpost', {
  get: function() {
    if(!this._outpost && this.roomType === ROOM_TYPE_MY_OUTPOST)
      this._outpost = new (require('./outpost'))(this)
    return this._outpost
  },
  enumerable: false,
  configurable: true
})

Object.defineProperty(Room.prototype, 'top', {
  get: function() {
    if(!this._top && this._top !== null)
      this._top = Game.map.describeExits(this.name)[TOP] || null
    return this._top
  },
  enumerable: false,
  configurable: true
})

Object.defineProperty(Room.prototype, 'right', {
  get: function() {
    if(!this._right && this._right !== null)
      this._right = Game.map.describeExits(this.name)[RIGHT] || null
    return this._right
  },
  enumerable: false,
  configurable: true
})

Object.defineProperty(Room.prototype, 'bottom', {
  get: function() {
    if(!this._bottom && this._right !== null)
      this._bottom = Game.map.describeExits(this.name)[BOTTOM] || null
    return this._bottom
  },
  enumerable: false,
  configurable: true
})

Object.defineProperty(Room.prototype, 'left', {
  get: function() {
    if(!this._left && this._left !== null)
      this._left = Game.map.describeExits(this.name)[LEFT] || null
    return this._left
  },
  enumerable: false,
  configurable: true
})

Object.defineProperty(Room.prototype, 'topleft', {
  get: function() {
    if(!this._topleft && this._topleft !== null) {
      if(this.top)
        this._topleft = Game.map.describeExits(this.top)[LEFT] || null
      else if(this.left)
        this._topleft = Game.map.describeExits(this.left)[TOP] || null
    }
    return this._topleft
  },
  enumerable: false,
  configurable: true
})

Object.defineProperty(Room.prototype, 'topright', {
  get: function() {
    if(!this._topright && this._topright !== null) {
      if(this.top)
        this._topright = Game.map.describeExits(this.top)[RIGHT] || null
      else if(this.right)
        this._topright = Game.map.describeExits(this.right)[TOP] || null
    }
    return this._topright
  },
  enumerable: false,
  configurable: true
})

Object.defineProperty(Room.prototype, 'bottomleft', {
  get: function() {
    if(!this._bottomleft && this._bottomleft !== null) {
      const exits = Game.map.describeExits(this.name)
      if(this.bottom)
        this._bottomleft = Game.map.describeExits(this.bottom)[LEFT] || null
      else if(this.left)
        this._bottomleft = Game.map.describeExits(this.left)[BOTTOM] || null
    }
    return this._bottomleft
  },
  enumerable: false,
  configurable: true
})

Object.defineProperty(Room.prototype, 'bottomright', {
  get: function() {
    if(!this._bottomright && this._bottomright !== null) {
      const exits = Game.map.describeExits(this.name)
      if(this.bottom)
        this._bottomright = Game.map.describeExits(this.bottom)[RIGHT] || null
      else if(this.right)
        this._bottomright = Game.map.describeExits(this.right)[BOTTOM] || null
    }
    return this._bottomright
  },
  enumerable: false,
  configurable: true
})
