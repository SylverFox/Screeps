exports.convertPosToWorldCoord = function(pos) {
  const match = /(W|E)(\d+)(N|S)(\d+)/.exec(pos.roomName)
  const roomX = match[1] === 'E' ? match[2] * 50 : match[2] * -50 - 50
  const roomY = match[3] === 'N' ? match[4] * 50 + 50 : match[4] * -50
  return {x: roomX + pos.x, y: roomY - pos.y}
}

exports.worldDistance = function(pos1, pos2) {
  if(!pos1 || !pos2)
    return Infinity

  if(pos1.roomName === pos2.roomName) {
    return Math.max(Math.abs(pos1.x-pos2.x), Math.abs(pos1.y-pos2.y))
  }
  coord1 = exports.convertPosToWorldCoord(pos1)
  coord2 = exports.convertPosToWorldCoord(pos2)
  return Math.max(Math.abs(coord1.x-coord2.x) + Math.abs(coord1.y-coord2.y))
}

exports.findClosestByWorldRange = function(pos, targets = [], exclude = []) {
  if(targets.length) {
    const sorted = targets.filter(t => !exclude.includes(t)).sort((a, b) =>
      exports.worldDistance(pos, a.pos) - exports.worldDistance(pos, b.pos)
    )
    if(sorted.length)
      return sorted[0]
  }
}

exports.findFullestCollectTarget = function(pos, base, exclude = [], includeFullBase = false) {
  let storages = includeFullBase ? base.baseTertiaryStorages : base.tertiaryStorages
  if(base.storage)
    storages.push(base.storage)

  const tertiaryTargets = storages.filter(s =>
    s.filledSpace > 50
  ).sort((a, b) => b.filledSpace / b.storeCapacity - a.filledSpace / a.storeCapacity)

  const target = tertiaryTargets.find(s => !exclude.includes(s)) || tertiaryTargets[0]
  if(target)
    return target
}

exports.findClosestDepositTarget = function(pos, base, exclude = [], includeFullBase = false) {
  let storages = includeFullBase ? base.basePrimaryStorages : base.primaryStorages
  const primaryTargets = storages.filter(s => s.freeSpace > 0)
  const primary = exports.findClosestByWorldRange(pos, primaryTargets, exclude)
  if(primary) return primary

  storages = includeFullBase ? base.baseSecondaryStorages : base.secondaryStorages
  const secondaryTargets = storages.filter(s => s.freeSpace > 0)
  const secondary = exports.findClosestByWorldRange(pos, secondaryTargets, exclude)
  if(secondary) return secondary

  if(base.storage && base.storage.freeSpace > 0) return base.storage
}

exports.findClosestRetrievingTarget = function(pos, base, exclude = [], includeFullBase = false) {
  const storages = includeFullBase ?
    base.baseSecondaryStorages.concat(base.baseTertiaryStorages) :
    base.secondaryStorages.concat(base.tertiaryStorages)
  const nonPrimaryTargets = storages.filter(s => s.filledSpace > 0)
  if(base.storage && base.storage.store[RESOURCE_ENERGY] > 0)
    nonPrimaryTargets.push(base.storage)
  const nonPrimary = exports.findClosestByWorldRange(pos, nonPrimaryTargets, exclude)
  if(nonPrimary) return nonPrimary

  if(!base.savingEnergy) {
    const primaryTargets = base.primaryStorages.filter(s => s.freeSpace > 0)
    const primary = exports.findClosestByWorldRange(pos, primaryTargets, exclude)
    if(primary) return primary
  }
}

exports.findBestConstructionTarget = function(pos, base, exclude = [], includeFullBase = false) {
  const constrSites = includeFullBase ? base.baseConstructionSites : base.myConstructionSites
  const constrTargets = constrSites.filter(cs => !exclude.includes(cs))

  if(!constrTargets.length) {
    return
  }

  const buildOrder = {
    STRUCTURE_SPAWN: 1,
    STRUCTURE_EXTENSIONS: 2,
    STRUCTURE_TOWER: 3,
    STRUCTURE_ROAD: 4,
    STRUCTURE_CONTAINER: 5,
    STRUCTURE_STORAGE: 6,
    STRUCTURE_RAMPART: 7,
    STRUCTURE_WALL: 8
  }

  constrTargets.sort((a, b) => {
    if(a.pos.isEqualTo(b.pos)) {
      return exports.worldDistance(pos, a.pos) - exports.worldDistance(pos, b.pos)
    } else {
      return (buildOrder[a.structureType] || 20) - (buildOrder[b.structureType] || 20)
    }
  })

  return constrTargets[0]
}
