const Map = require('../utils/roommap')

exports.run = function(outpost) {
  if (!outpost.memory.constructionPlan) {
    // build new construction plan
    outpost.memory.constructionPlan = buildConstructionPlan(outpost)
  }
  const jobs = retrieveConstructions(outpost)

  if (jobs.length) {
    return jobs
  } else {
    // delete plan and rebuild in the next iteration
    delete outpost.memory.constructionPlan
  }
}

function retrieveConstructions(outpost) {
  const map = new Map()
  map.import(outpost.memory.constructionPlan)
  const constructions = map.structures()

  // get all constructions that have not been build
  let jobs = []
  for (let c of constructions) {
    const pos = new RoomPosition(c.x, c.y, outpost.name)
    const type = c.type

    const blocked = pos.look().filter(s =>
      (s.type === LOOK_STRUCTURES && s.structure.structureType === type) ||
      (s.type === LOOK_CONSTRUCTION_SITES)
    ).length > 0

    if (!blocked) {
      jobs.push({
        pos,
        type
      })
    }
  }

  return jobs
}

function buildConstructionPlan(outpost) {
  const map = new Map()

  // apply terrain
  for (let x = 0; x < 50; x++) {
    for (let y = 0; y < 50; y++) {
      const terrain = Game.map.getTerrainAt(x, y, outpost.name)
      map.set(x, y, terrain === 'wall' ? map.WALL : map.GROUND)
    }
  }

  const spawn = outpost.ownedbase.spawns[0]

  // exit point closest to path in the nearby base
  const exitPointPath = outpost.ownedbase.findPath(spawn.pos, outpost.controller.pos, {ignoreCreeps: true})
  let exitPoint = exitPointPath[exitPointPath.length-1]
  exitPoint.x = (exitPoint.x % 49) === 0 ? Math.abs(exitPoint.x - 49) : exitPoint.x
  exitPoint.y = (exitPoint.y % 49) === 0 ? Math.abs(exitPoint.y - 49) : exitPoint.y
  exitPoint = new RoomPosition(exitPoint.x, exitPoint.y, outpost.name)

  // build path to controller
  const pathFromController = outpost.findPath(outpost.controller.pos, exitPoint, {
    ignoreCreeps: true,
    costCallback: (name, cm) => {
      return map.costMatrix()
    }
  })
  for (let p = 1; p < pathFromController.length - 1; p++) {
    map.set(pathFromController[p], STRUCTURE_ROAD)
  }

  // build path to sources and container
  for (let source of outpost.sources) {
    const pathFromSource = outpost.findPath(source.pos, exitPoint, {
      ignoreCreeps: true,
      costCallback: (name, cm) => {
        return map.costMatrix()
      }
    })

    map.set(pathFromSource[0], STRUCTURE_CONTAINER)
    map.adjacentFreeSpaces(pathFromSource[0]).forEach(
      s => map.set(s, STRUCTURE_ROAD)
    )

    for (let p = 1; p < pathFromSource.length - 1; p++) {
      map.set(pathFromSource[p], STRUCTURE_ROAD)
    }
  }

  return map.export()
}
