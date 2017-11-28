exports.findCollectTargets = function(base, exclude = [], minEnergy = 50) {
  const sourceContainers = base.sources.map(s => s.container)
    .filter(s => s && s.store[RESOURCE_ENERGY] > minEnergy && !exclude.includes(s.id))

  const targets = sourceContainers
  return targets
}

exports.findClosestCollectTarget = function(creep, exclude) {
  targets = exports.findCollectTargets(creep.home, exclude, creep.carryCapacity)
  if (targets.length) {
    const closest = creep.pos.findClosestByPath(targets)
    if(closest)
      return closest
  }

  // start collecting even if creep cannot be filled
  targets = exports.findCollectTargets(creep.home, exclude, 50)
  if (targets.length) {
    const closest = creep.pos.findClosestByPath(targets)
    if(closest)
      return closest
  }
}

/*
 * finds a deposit to store energy to
 * extensions and spawn first
 * then towers
 * then containers not next to sources
 */
exports.findClosestStoringDeposit = function(creep) {
  let deposits, closest

  // primary storage
  deposits = creep.home.myStructures.filter(s =>
      [STRUCTURE_SPAWN, STRUCTURE_EXTENSION].includes(s.structureType) &&
      s.energy < s.energyCapacity
  )

  if (deposits.length) {
    closest = creep.pos.findClosestByPath(deposits)
    if (closest)
      return closest
    else
      return deposits[0]
  }

  // towers
  deposits = creep.home.towers.filter(s => s.energy < s.energyCapacity - 50)

  if(deposits.length) {
    closest = creep.pos.findClosestByPath(deposits)
    if(closest)
      return closest
    else
      return deposits[0]
  }

  // container next to controller
  deposits = creep.home.structures.filter(s =>
    s.structureType === STRUCTURE_CONTAINER &&
    _.sum(s.store) < s.storeCapacity &&
    s.pos.inRangeTo(creep.room.controller, 4)
  )

  if(deposits.length) {
    closest = creep.pos.findClosestByPath(deposits)
    if(closest)
      return closest
    else
      return deposits[0]
  }

  // other storages
  deposits = creep.home.structures.filter(s =>
    [STRUCTURE_CONTAINER, STRUCTURE_STORAGE].includes(s.structureType) &&
    s.freeSpace > 0 &&
    !s.pos.findClosestByRange(FIND_SOURCES).pos.isNearTo(s)
  )

  if (deposits.length) {
    closest = creep.pos.findClosestByPath(deposits)
    if (closest)
      return closest
    else
      return deposits[0]
  }
}

/*
 * finds a deposit to retrieve enery from
 * returns a container not next to a source first, otherwise extension or spawn
 */
exports.findClosestRetrievingDeposit = function(creep, exclude = []) {
  let closest, deposits
  deposits = creep.home.structures.filter(s =>
    [STRUCTURE_CONTAINER, STRUCTURE_STORAGE].includes(s.structureType) &&
    s.store[RESOURCE_ENERGY] > 0 &&
    !exclude.includes(s.id)
  )

  if (deposits.length) {
    closest = creep.pos.findClosestByPath(deposits)
    if (closest)
      return closest
    else
      return deposits[0]
  }

  if (creep.home.savingEnergy) {
    // not allowed to gather from primary deposits
    return
  }

  deposits = creep.home.myStructures.filter(s =>
    [STRUCTURE_SPAWN, STRUCTURE_EXTENSION].includes(s.structureType) &&
    s.energy > 0 &&
    !exclude.includes(s.id)
  )

  if (deposits.length) {
    closest = creep.pos.findClosestByPath(deposits)
    if (closest)
      return closest
    else
      return deposits[0]
  }
}
