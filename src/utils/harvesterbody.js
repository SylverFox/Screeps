module.exports = function(storagePos, harvestPos, maxEnergy) {
  const path = getPathTerrain(storagePos, harvestPos)
  if (!path) return

  const bodies = buildAllBodies(maxEnergy)
  const bestBody = getHarvesterProfit(bodies, path)
  console.log(path.length, bestBody.profit, JSON.stringify(bestBody.body))
  return bestBody
}

function getPathTerrain(pos1, pos2) {
  const path = PathFinder.search(pos1, {
    pos: pos2,
    range: 1
  }, {
    ignoreCreeps: true,
    plainCost: 2,
    swampCost: 10,
    roomCallback: roomName => {
      let cm = new PathFinder.CostMatrix()
      Game.rooms[roomName].find(FIND_STRUCTURES).forEach(s => {
        if (s.structureType === STRUCTURE_ROAD)
          cm.set(s.pos.x, s.pos.y, 1)
        else if (s.structureType !== STRUCTURE_CONTAINER && s.structureType !== STRUCTURE_RAMPART)
          cm.set(s.pos.x, s.pos.y, 255)
      })
      return cm
    }
  })

  const terrains = []
  for (let point of path.path) {
    if (point.lookFor(LOOK_STRUCTURES).filter(s => s.structureType === STRUCTURE_ROAD).length)
      terrains.push('road')
    else
      terrains.push(Game.map.getTerrainAt(point))
  }
  return terrains
}

function bodyCost(body) {
  return body.map(p => BODYPART_COST[p]).reduce((a, b) => a + b)
}

function buildAllBodies(maxEnergy) {
  let bodies = []
  let body1 = []
  do {
    body1.push(WORK)
    let body2 = Array.from(body1)
    do {
      body2.push(CARRY)
      let body3 = Array.from(body2)
      do {
        body3.push(MOVE)
        bodies.push(Array.from(body3))
      } while(bodyCost(body3) <= maxEnergy)
    } while(bodyCost(body2) <= maxEnergy)
  } while (bodyCost(body1) <= maxEnergy)

  return bodies.filter(b => bodyCost(b) <= maxEnergy)
}

function getHarvesterProfit(bodies, path) {
  const P = path.length
  const T = {
    'road': 0.5,
    'plain': 1,
    'sawmp': 5
  }

  const profitableBodies = []
  for (let body of bodies) {
    const C = body.filter(p => p === CARRY).length
    const W = body.filter(p => p === WORK).length
    const M = body.filter(p => p === MOVE).length

    const moveEmpty = path.map(p => Math.ceil(T[p] * W / M)).reduce((a, b) => a + b)
    const moveFull = path.map(p => Math.ceil(T[p] * (W + C) / M)).reduce((a, b) => a + b)
    const harvest = Math.ceil(CARRY_CAPACITY * C / (2 * W))

    const cyclesPerLifetime = Math.floor(CREEP_LIFE_TIME / (moveEmpty + moveFull + harvest))
    const energyPerCycle = CARRY_CAPACITY * C
    const creepCost = bodyCost(body)
    const profit = cyclesPerLifetime * energyPerCycle - creepCost

    if (profit > 0)
      profitableBodies.push({
        body,
        profit
      })
  }

  profitableBodies.sort((a, b) => b.profit - a.profit)
  return profitableBodies.find(s => s)
}
