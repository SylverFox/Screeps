MOVE = 'move'
WORK = 'work'
CARRY = 'carry'

GROUND = 1
ROAD = 0.5

function ticksPerMove(terrain, body, full) {
  const moveP = body.filter(p => p === MOVE).length
  const weight = body.filter(p => full ? p !== MOVE : p!== MOVE && p !== CARRY).length
  return Math.ceil(terrain * weight / moveP)
}

function workTicks(body) {
  const carryP = body.filter(p => p === CARRY).length
  const workP = body.filter(p => p === WORK).length
  return Math.ceil(carryP * 25 / workP)
}

function cycleCost(terrain, body, pathLength) {
  const moveEmptyTicks = ticksPerMove(terrain, body, false) * pathLength
  const moveFullTicks = ticksPerMove(terrain, body, true) * pathLength
  const workT = workTicks(body)
  return moveEmptyTicks + moveFullTicks + workT
}

function harvestPerTick(cycleTicks, body) {
  const carry = body.filter(p => p === CARRY).length * 50
  return carry / cycleTicks
}

function bodyCost(body) {
  return body.map(p => p === WORK ? 100 : 50).reduce((a,b) => a+b)
}

function buildAllBodies(maxEnergy, parts, partIndex = 0, bodies = [], curBody = []) {
  const part = parts[partIndex]
  if(!part) {
    bodies.push(curBody)
    return bodies
  }

  do {
    curBody.push(part)
    let newBody = Array.from(curBody)
    buildAllBodies(maxEnergy, parts, partIndex + 1, bodies, newBody)
  } while(bodyCost(curBody) <= maxEnergy)

  return bodies.filter(b => bodyCost(b) <= maxEnergy)
}



const pathLength = 74
const maxEnergy = 800
const groundType = ROAD

let bodies = buildAllBodies(maxEnergy, [WORK, CARRY, MOVE])
let goodBodies = []

for(let body of bodies) {
  const cycleTicks = cycleCost(groundType, body, pathLength)
  const totalCycles = Math.floor(1500 / cycleTicks)
  const harvestPerCycle = body.filter(p => p === CARRY).length * 50
  const lifeTimeHarvest = harvestPerCycle * totalCycles
  const lifeCost = bodyCost(body)
  const profit = lifeTimeHarvest - lifeCost
  const profitPerTick = profit / 1500
  if(profitPerTick > 0) {
    goodBodies.push({body: body, profit: profit, pft: profitPerTick})
    //console.log('work:'+body.filter(b=>b===WORK).length, 'carry:'+body.filter(b=>b===CARRY).length, 'move:'+body.filter(b=>b===MOVE).length, profit, profitPerTick)
  }
}

goodBodies.sort((a, b) => b.profit - a.profit)
const maxProfit = goodBodies[0].profit
goodBodies = goodBodies.filter(b => b.profit === maxProfit)
for(let b of goodBodies)
  console.log('work:'+b.body.filter(b=>b===WORK).length, 'carry:'+b.body.filter(b=>b===CARRY).length, 'move:'+b.body. filter(b=>b===MOVE).length, b.profit, b.pft)
