const Creeps = require('./creeps')
const targetfinder = require('./utils.targetfinder')

exports.ERR_NEED_MORE_ENERGY = -1
exports.ERR_NO_CREEP_TO_SPAWN = -2

/*
 * Priority 1: if no creeps, use simple harvesters
 * Priority 2: get economy up, miners and transporters (equal amount)
 * Priority 3: get builders if construction is needed (max ?)
 * Priority 4: get upgraders (max ?)
 * Priority 5: get builders as repairers
 */
exports.run = function(base) {
  if (base.creeps.length < 2) {
    // PANIC!! everybody dead
    const newCreep = Creeps.buildCreep(Creeps.SIMPLE_HARVESTER, base.energyAvailable, base.energyCapacityAvailable)
    return newCreep
  }

  const roleCounts = getRoleCounts(base.creeps)
  const rolesNeeded = getRolesNeeded(roleCounts, base)
  const nextCreep = getNextRoleNeeded(roleCounts, rolesNeeded)

  Memory.nextCreep = nextCreep

  if(!nextCreep)
    return exports.ERR_NO_CREEP_TO_SPAWN

  const newCreep = Creeps.buildCreep(nextCreep, base.energyAvailable, base.energyCapacityAvailable)

  if(newCreep === Creeps.ERR_NOT_ENOUGH_ENERGY) {
    return exports.ERR_NEED_MORE_ENERGY
  } else if(newCreep === Creeps.ERR_INVALID_ROLE) {
    console.log('Invalid role given by strategy.spawning')
  } else {
    return newCreep
  }

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
  const rcl = base.controller.level

  Creeps.CREEP_ROLES.forEach(type => rolesNeeded[type] = 0)

  for(let source of base.sources) {
    // if the source has a container and enough energy to spawn miners,
    // it needs a Miner/Transporter combination. Otherwise it needs harvesters
    if(source.container && base.energyCapacityAvailable >= 550) {
      rolesNeeded[Creeps.MINER]++
      rolesNeeded[Creeps.TRANSPORTER]++
    } else {
      rolesNeeded[Creeps.SIMPLE_HARVESTER] += source.freeSpaces
    }
  }

  if(!roleCounts[Creeps.MINER] || !roleCounts[Creeps.TRANSPORTER]) {
    rolesNeeded[Creeps.SIMPLE_HARVESTER] += 2
  }

  if(targetfinder.findCollectTargets(base).length > 2)
    rolesNeeded[Creeps.TRANSPORTER]++

  let currentMechanics = roleCounts[Creeps.MECHANIC] || 1
  if(base.income > base.expense) {
    // energy leftover, make more additional workers
    currentMechanics++
  }

  //console.log(base.income, base.expense, currentMechanics)
  rolesNeeded[Creeps.MECHANIC] = currentMechanics

  if(base.controller.level >= 2) {
    rolesNeeded[Creeps.SCOUT] = base.roomsToScout.length
  }

  if(base.controller.level >= 4) {

    rolesNeeded[Creeps.OUTPOST_HARVESTER] = base.farmSources.length + base.outpostSources.length

    rolesNeeded[Creeps.CLAIMER] = base.farms.length + base.outposts.filter(o =>
      o.controller.reservation.ticksToEnd < (0.8 * CONTROLLER_RESERVE_MAX)
    ).length
    if(Memory.nextBase)
      rolesNeeded[Creeps.CLAIMER]++
  }

  if(base.hostileCreeps.length)
    rolesNeeded[Creep.RANGER] = 1

  return rolesNeeded
}

function getNextRoleNeeded(roleCounts, rolesNeeded) {
  if(roleCounts[Creeps.SIMPLE_HARVESTER] < rolesNeeded[Creeps.SIMPLE_HARVESTER]) {
    return Creeps.SIMPLE_HARVESTER
  }

  if(roleCounts[Creeps.RANGER] < rolesNeeded[Creeps.RANGER])
    return Creeps.RANGER

  const minerNeeded = roleCounts[Creeps.MINER] < rolesNeeded[Creeps.MINER]
  const transporterNeeded = roleCounts[Creeps.TRANSPORTER] < rolesNeeded[Creeps.TRANSPORTER]

  if(minerNeeded && transporterNeeded) {
    if(roleCounts[Creeps.MINER] > roleCounts[Creeps.TRANSPORTER])
      return Creeps.TRANSPORTER
    else
      return Creeps.MINER
  } else if(minerNeeded) {
    return Creeps.MINER
  } else if(transporterNeeded) {
    return Creeps.TRANSPORTER
  }

  if(roleCounts[Creeps.MECHANIC] < rolesNeeded[Creeps.MECHANIC]) {
    return Creeps.MECHANIC
  }

  if(roleCounts[Creeps.SCOUT] < rolesNeeded[Creeps.SCOUT]) {
    return Creeps.SCOUT
  }

  if(roleCounts[Creeps.OUTPOST_HARVESTER] < rolesNeeded[Creeps.OUTPOST_HARVESTER]) {
    return Creeps.OUTPOST_HARVESTER
  }

  if(roleCounts[Creeps.CLAIMER] < rolesNeeded[Creeps.CLAIMER]) {
    return Creeps.CLAIMER
  }
}
