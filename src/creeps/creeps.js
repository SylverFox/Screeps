const HomeHarvester = require('./home/homeharvester')
const HomeMechanic = require('./home/homemechanic')
const HomeMiner = require('./home/homeminer')
const HomeTransporter = require('./home/hometransporter')
const HomeUpgrader = require('./home/homeupgrader')

const Distributor = require('./home/distributor')

const BaseScout = require('./base/basescout')
const BaseClaimer = require('./base/baseclaimer')
const BaseMiner = require('./base/baseminer')
const BaseTransporter = require('./base/basetransporter')
const BaseHarvester = require('./base/baseharvester')
const BaseBuilder = require('./base/basebuilder')

const Settler = require('./world/settler')

const Ranger = require('./military/ranger')

const SimpleWorker = require('./simpleworker')

exports.ERR_NOT_ENOUGH_ENERGY = -1
exports.ERR_INVALID_ROLE = -2

exports.CREEP_ROLES = [
  exports.HOME_HARVESTER = 'homeHarvester',
  exports.HOME_MECHANIC = 'homeMechanic',
  exports.HOME_MINER = 'homeMiner',
  exports.HOME_TRANSPORTER = 'homeTransporter',
  exports.HOME_UPGRADER = 'homeUpgrader',
  exports.BASE_SCOUT = 'baseScout',
  exports.BASE_CLAIMER = 'baseClaimer',
  exports.BASE_MINER = 'baseMiner',
  exports.BASE_TRANSPORTER = 'baseTransporter',
  exports.BASE_HARVESTER = 'baseHarvester',
  exports.BASE_BUILDER = 'baseBuilder',
  exports.SETTLER = 'settler',
  exports.RANGER = 'ranger',
  exports.DISTRIBUTOR = 'distributor',
  exports.SIMPLEWORKER = 'simpleworker'
]

const roleToCreepMap = {
  [exports.HOME_HARVESTER]: HomeHarvester,
  [exports.HOME_MECHANIC]: HomeMechanic,
  [exports.HOME_MINER]: HomeMiner,
  [exports.HOME_TRANSPORTER]: HomeTransporter,
  [exports.HOME_UPGRADER]: HomeUpgrader,
  [exports.BASE_SCOUT]: BaseScout,
  [exports.BASE_CLAIMER]: BaseClaimer,
  [exports.BASE_MINER]: BaseMiner,
  [exports.BASE_TRANSPORTER]: BaseTransporter,
  [exports.BASE_HARVESTER]: BaseHarvester,
  [exports.BASE_BUILDER]: BaseBuilder,
  [exports.SETTLER]: Settler,
  [exports.RANGER]: Ranger,
  [exports.DISTRIBUTOR]: Distributor,
  [exports.SIMPLEWORKER]: SimpleWorker
}

exports.from = function(creep) {
  if (!creep.memory || !creep.memory.role) return creep

  const creepType = roleToCreepMap[creep.memory.role]
  return creepType ? new creepType(creep) : creep
}

exports.buildCreep = function(role, energy, maxEnergy) {
  if (!role || !exports.CREEP_ROLES.includes(role)) return exports.ERR_INVALID_ROLE

  const body = roleToCreepMap[role].build(maxEnergy)
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
