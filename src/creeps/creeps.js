const SimpleHarvester = require('./creeps.simpleharvester')
const Miner = require('./creeps.miner')
const Transporter = require('./creeps.transporter')
const Mechanic = require('./creeps.mechanic')
const Scout = require('./creeps.scout')
const OutpostHarvester = require('./creeps.outpostharvester')
const Claimer = require('./creeps.claimer')
const Ranger = require('./creeps.ranger')

exports.ERR_NOT_ENOUGH_ENERGY = -1
exports.ERR_INVALID_ROLE = -2

exports.CREEP_ROLES = [
  exports.SIMPLE_HARVESTER = 'simpleHarvester',
  exports.MECHANIC = 'mechanic',
  exports.MINER = 'miner',
  exports.TRANSPORTER = 'transporter',
  exports.SCOUT = 'scout',
  exports.OUTPOST_HARVESTER = 'outpostHarvester',
  exports.CLAIMER = 'claimer',
  exports.RANGER = 'ranger'
]

const roleToCreepMap = {
  [exports.SIMPLE_HARVESTER]: SimpleHarvester,
  [exports.MECHANIC]: Mechanic,
  [exports.MINER]: Miner,
  [exports.TRANSPORTER]: Transporter,
  [exports.SCOUT]: Scout,
  [exports.OUTPOST_HARVESTER]: OutpostHarvester,
  [exports.CLAIMER]: Claimer,
  [exports.RANGER]: Ranger
}

const roleToBodyMap = {
  [exports.SIMPLE_HARVESTER]: simpleHarvester,
  [exports.MECHANIC]: mechanic,
  [exports.MINER]: miner,
  [exports.TRANSPORTER]: transporter,
  [exports.SCOUT]: scout,
  [exports.OUTPOST_HARVESTER]: outpostHarvester,
  [exports.CLAIMER]: claimer,
  [exports.RANGER]: ranger
}

exports.from = function(creep) {
  if (!creep.memory || !creep.memory.role) return creep

  const creepType = roleToCreepMap[creep.memory.role]
  return creepType ? new creepType(creep) : creep
}

exports.buildCreep = function(role, energy, maxEnergy) {
  if (!role || !exports.CREEP_ROLES.includes(role)) return exports.ERR_INVALID_ROLE

  const body = roleToBodyMap[role](maxEnergy)
  const cost = body.map(p => BODYPART_COST[p]).reduce((a, b) => a + b)

  if (cost > energy) {
    return exports.ERR_NOT_ENOUGH_ENERGY
  } else {
    return {
      body: body,
      memory: {
        role: role
      }
    }
  }
}

function simpleHarvester(maxEnergy) {
  return [MOVE, WORK, CARRY]
}

function mechanic(maxEnergy) {
  const set = [WORK, CARRY, MOVE, MOVE]
  const setCost = set.map(p => BODYPART_COST[p]).reduce((a, b) => a + b)
  const maxSets = Math.min(Math.floor(maxEnergy / setCost), 4)

  const body = Array(maxSets).fill(set).reduce((a, b) => a.concat(b), []).sort()
  return body
}

function miner(maxEnergy) {
  let leftover = maxEnergy - BODYPART_COST[MOVE]
  let workParts = Math.floor(leftover / BODYPART_COST[WORK])
  workParts = Math.min(workParts, 5)
  const parts = Array(workParts).fill(WORK)

  return [MOVE].concat(parts)
}

function transporter(maxEnergy) {
  const set = [MOVE, CARRY, CARRY]
  const setCost = set.map(p => BODYPART_COST[p]).reduce((a, b) => a + b)
  const maxSets = Math.min(Math.floor(maxEnergy / setCost))

  const body = Array(maxSets).fill(set).reduce((a, b) => a.concat(b), []).sort()
  return body
}

function scout(maxEnergy) {
  return [MOVE]
}

function outpostHarvester(maxEnergy) {
  const set = [WORK, CARRY, CARRY, MOVE, MOVE, MOVE]
  const setCost = set.map(p => BODYPART_COST[p]).reduce((a, b) => a + b)
  const maxSets = Math.min(Math.floor(maxEnergy / setCost), 3)

  const body = Array(maxSets).fill(set).reduce((a, b) => a.concat(b), []).sort()
  return body
}

function claimer(maxEnergy) {
  return [CLAIM, CLAIM, MOVE, MOVE]
}

function ranger(maxEnergy) {
  return [TOUGH, TOUGH, TOUGH, MOVE, MOVE, MOVE, MOVE, MOVE, RANGED_ATTACK, HEAL]
}
