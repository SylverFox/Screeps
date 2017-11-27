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

Object.defineProperty(Room.prototype, 'topleft', {
  get: function() {
    if(!this._topleft) {
      const exits = Game.map.describeExits(this.name)
      if(exits[TOP])
        this._topleft = Game.map.describeExits(exits[TOP])[LEFT]
      else if(exits[LEFT])
        this._topleft = Game.map.describeExits(exits[LEFT])[TOP]
    }
    return this._topleft
  },
  enumerable: false,
  configurable: true
})

Object.defineProperty(Room.prototype, 'topright', {
  get: function() {
    if(!this._topright) {
      const exits = Game.map.describeExits(this.name)
      if(exits[TOP])
        this._topright = Game.map.describeExits(exits[TOP])[RIGHT]
      else if(exits[RIGHT])
        this._topright = Game.map.describeExits(exits[RIGHT])[TOP]
    }
    return this._topright
  },
  enumerable: false,
  configurable: true
})

Object.defineProperty(Room.prototype, 'bottomleft', {
  get: function() {
    if(!this._bottomleft) {
      const exits = Game.map.describeExits(this.name)
      if(exits[BOTTOM])
        this._bottomleft = Game.map.describeExits(exits[BOTTOM])[LEFT]
      else if(exits[LEFT])
        this._bottomleft = Game.map.describeExits(exits[LEFT])[BOTTOM]
    }
    return this._bottomleft
  },
  enumerable: false,
  configurable: true
})

Object.defineProperty(Room.prototype, 'bottomright', {
  get: function() {
    if(!this._bottomright) {
      const exits = Game.map.describeExits(this.name)
      if(exits[BOTTOM])
        this._bottomright = Game.map.describeExits(exits[BOTTOM])[RIGHT]
      else if(exits[RIGHT])
        this._bottomright = Game.map.describeExits(exits[RIGHT])[BOTTOM]
    }
    return this._bottomright
  },
  enumerable: false,
  configurable: true
})

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

Object.defineProperty(StructureStorage.prototype, 'freeSpace', {
  get: function() {
    if(!this._freeSpace)
      this._freeSpace = this.storeCapacity - this.filledSpace
    return this._freeSpace
  },
  enumerable: false,
  configurable: true
})

Object.defineProperty(StructureStorage.prototype, 'filledSpace', {
  get: function() {
    if(!this._filledSpace)
      this._filledSpace = Object.keys(this.store)
        .map(rt => this.store[rt]).reduce((a, b) => a + b)
    return this._filledSpace
  },
  enumerable: false,
  configurable: true
})

Object.defineProperty(StructureContainer.prototype, 'freeSpace', {
  get: function() {
    if(!this._freeSpace)
      this._freeSpace = this.storeCapacity - this.filledSpace
    return this._freeSpace
  },
  enumerable: false,
  configurable: true
})

Object.defineProperty(StructureContainer.prototype, 'filledSpace', {
  get: function() {
    if(!this._filledSpace)
      this._filledSpace = Object.keys(this.store)
        .map(rt => this.store[rt]).reduce((a, b) => a + b)
    return this._filledSpace
  },
  enumerable: false,
  configurable: true
})

Object.defineProperty(StructureExtension.prototype, 'freeSpace', {
  get: function() {
    return this.energyCapacity - this.energy
  },
  enumerable: false,
  configurable: true
})

Object.defineProperty(StructureExtension.prototype, 'filledSpace', {
  get: function() {
    return this.energy
  },
  enumerable: false,
  configurable: true
})

Object.defineProperty(StructureSpawn.prototype, 'freeSpace', {
  get: function() {
    return this.energyCapacity - this.energy
  },
  enumerable: false,
  configurable: true
})

Object.defineProperty(StructureSpawn.prototype, 'filledSpace', {
  get: function() {
    return this.energy
  },
  enumerable: false,
  configurable: true
})

Object.defineProperty(StructureTower.prototype, 'freeSpace', {
  get: function() {
    return this.energyCapacity - this.energy
  },
  enumerable: false,
  configurable: true
})

Object.defineProperty(StructureTower.prototype, 'filledSpace', {
  get: function() {
    return this.energy
  },
  enumerable: false,
  configurable: true
})
