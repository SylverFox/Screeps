Object.defineProperty(StructureStorage.prototype, 'freeSpace', {
  get: function() {
    if(!this._freeSpace)
      this._freeSpace = this.storeCapacity - this.filledSpace
    return this._freeSpace
  }, enumerable: false, configurable: true
})

Object.defineProperty(StructureStorage.prototype, 'filledSpace', {
  get: function() {
    if(!this._filledSpace)
      this._filledSpace = Object.keys(this.store)
        .map(rt => this.store[rt]).reduce((a, b) => a + b)
    return this._filledSpace
  }, enumerable: false, configurable: true
})

Object.defineProperty(StructureStorage.prototype, 'canWithdraw', {
  get: function() {
    return true
  }, enumerable: false, configurable: true
})

Object.defineProperty(StructureStorage.prototype, 'canTransfer', {
  get: function() {
    return true
  }, enumerable: false, configurable: true
})



Object.defineProperty(StructureContainer.prototype, 'freeSpace', {
  get: function() {
    if(!this._freeSpace)
      this._freeSpace = this.storeCapacity - this.filledSpace
    return this._freeSpace
  }, enumerable: false, configurable: true
})

Object.defineProperty(StructureContainer.prototype, 'filledSpace', {
  get: function() {
    if(!this._filledSpace)
      this._filledSpace = Object.keys(this.store)
        .map(rt => this.store[rt]).reduce((a, b) => a + b)
    return this._filledSpace
  }, enumerable: false, configurable: true
})

Object.defineProperty(StructureContainer.prototype, 'canWithdraw', {
  get: function() {
    return true
  }, enumerable: false, configurable: true
})

Object.defineProperty(StructureContainer.prototype, 'canTransfer', {
  get: function() {
    const area = this.room.lookAtArea(
      this.pos.y-1, this.pos.x-1, this.pos.y+1, this.pos.x+1, true
    ).some(
      s => s.type === LOOK_SOURCES || s.type === LOOK_MINERALS
    )
    return !area
  }, enumerable: false, configurable: true
})



Object.defineProperty(StructureExtension.prototype, 'freeSpace', {
  get: function() {
    return this.energyCapacity - this.energy
  }, enumerable: false, configurable: true
})

Object.defineProperty(StructureExtension.prototype, 'filledSpace', {
  get: function() {
    return this.energy
  }, enumerable: false, configurable: true
})

Object.defineProperty(StructureExtension.prototype, 'canWithdraw', {
  get: function() {
    return this.room.base && !this.room.base.savingEnergy
  }, enumerable: false, configurable: true
})

Object.defineProperty(StructureExtension.prototype, 'canTransfer', {
  get: function() {
    return true
  }, enumerable: false, configurable: true
})



Object.defineProperty(StructureSpawn.prototype, 'freeSpace', {
  get: function() {
    return this.energyCapacity - this.energy
  }, enumerable: false, configurable: true
})

Object.defineProperty(StructureSpawn.prototype, 'filledSpace', {
  get: function() {
    return this.energy
  }, enumerable: false, configurable: true
})

Object.defineProperty(StructureSpawn.prototype, 'canWithdraw', {
  get: function() {
    return this.room.base && !this.room.base.savingEnergy
  }, enumerable: false, configurable: true
})

Object.defineProperty(StructureSpawn.prototype, 'canTransfer', {
  get: function() {
    return true
  }, enumerable: false, configurable: true
})



Object.defineProperty(StructureTower.prototype, 'freeSpace', {
  get: function() {
    return this.energyCapacity - this.energy
  }, enumerable: false, configurable: true
})

Object.defineProperty(StructureTower.prototype, 'filledSpace', {
  get: function() {
    return this.energy
  }, enumerable: false, configurable: true
})

Object.defineProperty(StructureTower.prototype, 'canWithdraw', {
  get: function() {
    return this.room.base && !this.room.base.savingEnergy
  }, enumerable: false, configurable: true
})

Object.defineProperty(StructureTower.prototype, 'canTransfer', {
  get: function() {
    return true
  }, enumerable: false, configurable: true
})
