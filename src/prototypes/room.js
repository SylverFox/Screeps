const Base = require('../base')
const Outpost = require('../outpost')

Object.defineProperty(Room.prototype, 'sources', {
  get: function () {
    return Game.worldmap.roomInfo(this.name).sources
  }
})

Object.defineProperty(Room.prototype, 'type', {
  get: function () {
    return Game.worldmap.roomInfo(this.name).type
  }
})

Object.defineProperty(Room.prototype, 'mineral', {
  get: function () {
    return Game.worldmap.roomInfo(this.name).mineral
  }
})

Object.defineProperty(Room.prototype, 'base', {
  get: function () {
    if (!this._base && this.type === ROOM_TYPE_MY_BASE)
      this._base = new Base(this)
    return this._base
  }
})

Object.defineProperty(Room.prototype, 'outpost', {
  get: function () {
    if (!this._outpost && this.type === ROOM_TYPE_MY_OUTPOST)
      this._outpost = new Outpost(this)
    return this._outpost
  }
})

Object.defineProperty(Room.prototype, 'structures', {
  get: function () {
    if (!this._structures)
      this._structures = this.find(FIND_STRUCTURES)
    return this._structures
  }
})

Object.defineProperty(Room.prototype, 'myStructures', {
  get: function () {
    if (!this._myStructures)
      this._myStructures = this.structures.filter(s => s.my)
    return this._myStructures
  }
})

Object.defineProperty(Room.prototype, 'repairableStructures', {
  get: function () {
    if (!this._repairableStructures)
      this._repairableStructures = this.structures.filter(
        s => s.hits < s.hitsMax
      ).sort((a, b) => a.hits / a.hitsMax - b.hits / b.hitsMax)
    return this._repairableStructures
  }
})

Object.defineProperty(Room.prototype, 'myConstructionSites', {
  get: function () {
    if (!this._myConstructionSites)
      this._myConstructionSites = this.find(FIND_MY_CONSTRUCTION_SITES)
    return this._myConstructionSites
  }
})


// TODO: simplify the rest
Object.defineProperty(Room.prototype, 'primaryStorages', {
  get: function () {
    if (!this._primaryStorages) {
      let storages = this.myStructures.filter(
        s => [STRUCTURE_SPAWN, STRUCTURE_EXTENSION].includes(s.structureType)
      )

      this.towers.filter(
        t => (t.energyCapacity - t.energy) > 50
      ).forEach(t => storages.push(t))

      this._primaryStorages = storages
    }
    return this._primaryStorages
  }, enumerable: false, configurable: true
})

Object.defineProperty(Room.prototype, 'secondaryStorages', {
  get: function () {
    if (!this._secondaryStorages) {
      this._secondaryStorages = this.structures.filter(s =>
        s.structureType === STRUCTURE_CONTAINER &&
        !this.tertiaryStorages.includes(s)
      )
    }
    return this._secondaryStorages
  }, enumerable: false, configurable: true
})

Object.defineProperty(Room.prototype, 'tertiaryStorages', {
  get: function () {
    if (!this._tertiaryStorages) {
      this._tertiaryStorages = this.sources.map(s => s.container).filter(s => s)
    }
    return this._tertiaryStorages
  }, enumerable: false, configurable: true
})

Object.defineProperty(Room.prototype, 'drops', {
  get: function () {
    if (!this._drops)
      this._drops = this.find(FIND_DROPPED_RESOURCES)
    return this._drops
  }, enumerable: false, configurable: true
})

Object.defineProperty(Room.prototype, 'top', {
  get: function () {
    if (!this._top && this._top !== null)
      this._top = Game.map.describeExits(this.name)[TOP] || null
    return this._top
  }, enumerable: false, configurable: true
})

Object.defineProperty(Room.prototype, 'right', {
  get: function () {
    if (!this._right && this._right !== null)
      this._right = Game.map.describeExits(this.name)[RIGHT] || null
    return this._right
  }, enumerable: false, configurable: true
})

Object.defineProperty(Room.prototype, 'bottom', {
  get: function () {
    if (!this._bottom && this._bottom !== null)
      this._bottom = Game.map.describeExits(this.name)[BOTTOM] || null
    return this._bottom
  }, enumerable: false, configurable: true
})

Object.defineProperty(Room.prototype, 'left', {
  get: function () {
    if (!this._left && this._left !== null)
      this._left = Game.map.describeExits(this.name)[LEFT] || null
    return this._left
  }, enumerable: false, configurable: true
})

Object.defineProperty(Room.prototype, 'topleft', {
  get: function () {
    if (!this._topleft && this._topleft !== null) {
      if (this.top)
        this._topleft = Game.map.describeExits(this.top)[LEFT] || null
      else if (this.left)
        this._topleft = Game.map.describeExits(this.left)[TOP] || null
    }
    return this._topleft
  }, enumerable: false, configurable: true
})

Object.defineProperty(Room.prototype, 'topright', {
  get: function () {
    if (!this._topright && this._topright !== null) {
      if (this.top)
        this._topright = Game.map.describeExits(this.top)[RIGHT] || null
      else if (this.right)
        this._topright = Game.map.describeExits(this.right)[TOP] || null
    }
    return this._topright
  }, enumerable: false, configurable: true
})

Object.defineProperty(Room.prototype, 'bottomleft', {
  get: function () {
    if (!this._bottomleft && this._bottomleft !== null) {
      const exits = Game.map.describeExits(this.name)
      if (this.bottom)
        this._bottomleft = Game.map.describeExits(this.bottom)[LEFT] || null
      else if (this.left)
        this._bottomleft = Game.map.describeExits(this.left)[BOTTOM] || null
    }
    return this._bottomleft
  }, enumerable: false, configurable: true
})

Object.defineProperty(Room.prototype, 'bottomright', {
  get: function () {
    if (!this._bottomright && this._bottomright !== null) {
      const exits = Game.map.describeExits(this.name)
      if (this.bottom)
        this._bottomright = Game.map.describeExits(this.bottom)[RIGHT] || null
      else if (this.right)
        this._bottomright = Game.map.describeExits(this.right)[BOTTOM] || null
    }
    return this._bottomright
  }, enumerable: false, configurable: true
})
