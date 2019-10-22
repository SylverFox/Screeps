
const TOWER_REPAIR = 'repair'
const TOWER_ATTACK = 'attack'
const TOWER_HEAL = 'heal'

exports.work = function(base) {
  const saving = base.savingEnergy
  const towers = base.towers
  let idle
  for (let tower of towers) {
    idle = workTower(tower, saving)
  }
  base.memory.towersIdle = idle
}

/*
 * work towers
 */
function workTower(tower, saving) {
  // heal creeps
  const wounded = tower.room.find(FIND_MY_CREEPS).filter(c =>
    c.hits < c.hitsMax).sort((a,b) => a.hits/a.hitsMax - b.hits/b.hitsMax
  )

  if(wounded.length) {
    tower.heal(wounded[0])
    return
  }

  // attack hostiles
  const hostiles = tower.room.find(FIND_HOSTILE_CREEPS).sort((a,b) =>
    a.hits/a.hitsMax - b.hits/b.hitsMax
  )

  if(hostiles.length) {
    tower.attack(hostiles[0])
    return
  }

  // only repair if enough buffered energy
  if(tower.room.base.savingEnergy || (tower.energy / tower.energyCapacity) < 0.80) return

  // repair damaged structures
  const damaged = tower.room.structures.filter(s => {
    if([STRUCTURE_WALL, STRUCTURE_RAMPART].includes(s.structureType))
      return false
    if(s.hits === s.hitsMax)
      return false
    if(_getEffectiveness(TOWER_REPAIR, tower.pos.getRangeTo(s.pos)) + s.hits < s.hitsMax)
      return true
  }).sort((a, b) => a.hits/a.hitsMax - b.hits/b.hitsMax)


  if(damaged.length) {
    tower.repair(damaged[0])
  }

  return true
}

function _getEffectiveness(action, range) {
  if(action === TOWER_REPAIR) {
    return Math.max(range > 5 ? 800 - 40 * (range-5) : 800, 200)
    return
  } else if(action === TOWER_ATTACK) {
    return Math.max(range > 5 ? 600 - 30 * (range-5) : 600, 150)
  } else if(action === TOWER_HEAL) {
    return Math.max(range > 5 ? 400 - 20 * (range-5) : 400, 100)
  }
}
