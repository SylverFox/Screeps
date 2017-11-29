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

exports.findFullestCollectTarget = function(pos, base, exclude = []) {
  const tertiaryTargets = base.tertiaryStorages.filter(s =>
    s.filledSpace > 50
  ).sort((a, b) => b.filledSpace / b.storeCapacity - a.filledSpace / a.storeCapacity)
  if(tertiaryTargets.length)
    return tertiaryTargets[0]

  if(base.storage && base.storage.filledSpace > 0) return base.storage
}

exports.findClosestDepositTarget = function(pos, base, exclude = []) {
  const primaryTargets = base.primaryStorages.filter(s => s.freeSpace > 0)
  const primary = exports.findClosestByWorldRange(pos, primaryTargets, exclude)
  if(primary) return primary

  const secondaryTargets = base.secondaryStorages.filter(s => s.freeSpace > 0)
  const secondary = exports.findClosestByWorldRange(pos, secondaryTargets, exclude)
  if(secondary) return secondary

  if(base.storage && base.storage.freeSpace > 0) return base.storage
}

exports.findClosestRetrievingTarget = function(pos, base, exclude = []) {
  let nonPrimaryTargets = base.secondaryStorages.filter(s => s.filledSpace > 0).concat(
    base.tertiaryStorages.filter(s => s.filledSpace > 0)
  )
  if(base.storage && base.storage.filledSpace > 0)
    nonPrimaryTargets.push(base.storage)
  const nonPrimary = exports.findClosestByWorldRange(pos, nonPrimaryTargets, exclude)
  if(nonPrimary) return nonPrimary

  if(!base.savingEnergy) {
    const primaryTargets = base.primaryStorages.filter(s => s.freeSpace > 0)
    const primary = exports.findClosestByWorldRange(pos, primaryTargets, exclude)
    if(primary) return primary
  }
}
