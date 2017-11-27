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
 * Prio 1: heal my creeps
 * Prio 2: attack hostile creeps
 * Prio 3: repair severly damaged structures
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

  // do not repair if spawn is saving
  if(saving) return
  // only repair if enough buffered energy
  if((tower.energy / tower.energyCapacity) < 0.80) return

  // repair damaged structures
  const damaged = tower.room.base.damagedStructures

  if(damaged.length) {
    tower.repair(damaged[0])
  }

  return true
}
