const Creeps = require('../creeps/creeps')

exports.ERR_NEED_MORE_ENERGY = -1
exports.ERR_NO_CREEP_TO_SPAWN = -2

exports.run = function(base) {
  const roleCounts = getRoleCounts(base.creeps)
  const rolesNeeded = getRolesNeeded(roleCounts, base)
  const nextCreeps = getNextRoleNeeded(roleCounts, rolesNeeded)

  //console.log(base.name, JSON.stringify(nextCreeps), JSON.stringify(rolesNeeded))
  base.memory.nextCreeps = nextCreeps

  if(!nextCreeps.length)
    return exports.ERR_NO_CREEP_TO_SPAWN

  let newCreep
  for(let nc of nextCreeps) {
    newCreep = Creeps.buildCreep(nc, base.energyAvailable, base.energyCapacityAvailable)
    if(newCreep !== Creeps.ERR_NOT_ENOUGH_ENERGY)
      break
  }

  if(newCreep === Creeps.ERR_NOT_ENOUGH_ENERGY)
    return exports.ERR_NEED_MORE_ENERGY
  else
    return newCreep
}

function getRoleCounts(creeps) {
  let roleCounts = {}
  Creeps.CREEP_ROLES.forEach(type => roleCounts[type] = 0)

  for (let c of creeps)
    roleCounts[c.memory.role]++

  return roleCounts
}

function getRolesNeeded(roleCounts, base) {
  let rolesNeeded = {}
  Creeps.CREEP_ROLES.forEach(type => rolesNeeded[type] = 0)

  getHomeRolesNeeded(roleCounts, rolesNeeded, base)
  getBaseRolesNeeded(roleCounts, rolesNeeded, base)
  getMilitaryRolesNeeded(roleCounts, rolesNeeded, base)

  return rolesNeeded
}

function getHomeRolesNeeded(roleCounts, rolesNeeded, base) {
  if(base.energyCapacityAvailable >= 550) {
    rolesNeeded[Creeps.HOME_MINER] = base.sources.filter(s => s.container).length
    rolesNeeded[Creeps.HOME_TRANSPORTER] = rolesNeeded[Creeps.HOME_MINER]
    rolesNeeded[Creeps.HOME_UPGRADER] = 1
  }

  const sourcesTaken = base.getCreepTargetsByRole(Creeps.HOME_MINER)
  rolesNeeded[Creeps.HOME_HARVESTER] = base.sources.filter(
    s => !sourcesTaken.includes(s)
  ).map(s => s.freeSpaces).reduce((a, b) => a + b, 0)

  rolesNeeded[Creeps.HOME_MECHANIC] = roleCounts[Creeps.HOME_MECHANIC]
  if(base.income > base.expense) {
    rolesNeeded[Creeps.HOME_MECHANIC] = Math.min(3, rolesNeeded[Creeps.HOME_MECHANIC]+1)
  }

  if(base.storage) {
    rolesNeeded[Creeps.DISTRIBUTOR] = 1
  }
}

function getBaseRolesNeeded(roleCounts, rolesNeeded, base) {
  if(base.controller.level >= 2 && Game.empire.worldmap.findClosestFoggedRoom(base.name)) {
    rolesNeeded[Creeps.BASE_SCOUT] = 1
  }

  if(base.outposts.length) {
    const outpostSourcesTaken = base.getCreepTargetsByRole(Creeps.BASE_MINER)
    rolesNeeded[Creeps.BASE_HARVESTER] = base.outpostSources.filter(
      s => !outpostSourcesTaken.includes(s)
    ).map(s => s.freeSpaces).reduce((a, b) => a + b, 0)
    //rolesNeeded[Creeps.BASE_HARVESTER] = 0

    rolesNeeded[Creeps.BASE_MINER] = base.outpostSources.filter(s => s.container).length
    rolesNeeded[Creeps.BASE_TRANSPORTER] = rolesNeeded[Creeps.BASE_MINER] * 2
    rolesNeeded[Creeps.BASE_CLAIMER] = base.roomsToClaim.length
  }

  if(base.controller.level >= 4) {
    rolesNeeded[Creeps.BASE_BUILDER] = base.rooms.filter(r => r.myConstructionSites.length).length
  }

  if(Memory.nextBase && Game.rooms[Memory.nextBase.roomName]) {
    rolesNeeded[Creeps.SETTLER] = 1
  }
}

function getMilitaryRolesNeeded(rolesCounts, rolesNeeded, base) {
  if(base.defcon < 5)
    rolesNeeded[Creeps.RANGER] = 1
}

function getNextRoleNeeded(roleCounts, rolesNeeded) {
  const priorityOrder = [
    Creeps.RANGER,
    Creeps.DISTRIBUTOR,
    Creeps.HOME_MINER,
    Creeps.HOME_TRANSPORTER,
    Creeps.HOME_HARVESTER,
    Creeps.HOME_UPGRADER,
    Creeps.HOME_MECHANIC,
    Creeps.BASE_SCOUT,
    Creeps.BASE_CLAIMER,
    //Creeps.BASE_BUILDER,
    Creeps.BASE_MINER,
    Creeps.BASE_TRANSPORTER,
    Creeps.BASE_HARVESTER,
    Creeps.SETTLER
  ]

  let creepsNeeded = []

  for(let po of priorityOrder) {
    if(roleCounts[po] < rolesNeeded[po])
      creepsNeeded.push(po)
  }

  // make sure that creeps who increase income are generated first
  if(
    creepsNeeded.includes(Creeps.HOME_MINER) ||
    creepsNeeded.includes(Creeps.HOME_TRANSPORTER) ||
    creepsNeeded.includes(Creeps.HOME_HARVESTER) ||
    creepsNeeded.includes(Creeps.DISTRIBUTOR)
  ) {
    creepsNeeded = creepsNeeded.filter(
      c => [Creeps.HOME_MINER, Creeps.HOME_TRANSPORTER, Creeps.HOME_HARVESTER, Creeps.DISTRIBUTOR].includes(c)
    )
  }

  return creepsNeeded
}
