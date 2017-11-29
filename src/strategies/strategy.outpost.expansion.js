const Map = require('./utils.map')

exports.run = function(outpost) {
  if(!outpost.memory.constructionPlan) {
    // build new construction plan
    outpost.memory.constructionPlan = buildConstructionPlan(outpost)
  }

  const jobs = retrieveConstructions(outpost)

  if(jobs.length) {
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
  for(let c of constructions) {
    const pos = new RoomPosition(c.x, c.y, outpost.name)
    const type = c.type

    const blocked = pos.look().filter(s =>
      (s.type === LOOK_STRUCTURES && s.structure.structureType === type) ||
      (s.type === LOOK_CONSTRUCTION_SITES)
    ).length > 0

    if(!blocked) {
      jobs.push({pos, type})
    }
  }
  
  return jobs
}

function buildConstructionPlan(outpost) {
  const map = new Map()

  // apply terrain
  for(let x = 0; x < 50; x++) {
    for(let y = 0; y < 50; y++) {
      const terrain = Game.map.getTerrainAt(x, y, outpost.name)
      map.set(x, y, terrain === 'wall' ? map.WALL : map.GROUND)
    }
  }

  const spawns = outpost.bases.map(b => b.spawns[0]).filter(s => s)

  for(let s of spawns) {
    const path = outpost.findPath(outpost.controller.pos, s.pos, {
      ignoreCreeps: true,
      costCallback: (name, cm) => {
        return map.costMatrix()
      }
    })

    for(let p = 1; p < path.length - 1; p++) {
      map.set(path[p], STRUCTURE_ROAD)
    }
  }

  for(let s of spawns) {
    for(let source of outpost.sources) {
      const path = outpost.findPath(source.pos, s.pos, {
        ignoreCreeps: true,
        costCallback: (name, cm) => {
          return map.costMatrix()
        }
      })

      map.set(path[0], STRUCTURE_CONTAINER)
      map.adjacentFreeSpaces(path[0]).forEach(
        s => map.set(s, STRUCTURE_ROAD)
      )

      for(let p = 1; p < path.length - 1; p++) {
        map.set(path[p], STRUCTURE_ROAD)
      }
    }
  }

  for(let s of spawns) {
    const path = outpost.findPath(outpost.mineral.pos, s.pos, {
      ignoreCreeps: true,
      costCallback: (name, cm) => {
        return map.costMatrix()
      }
    })

    map.set(path[0], STRUCTURE_CONTAINER)
    map.adjacentFreeSpaces(path[0]).forEach(
      s => map.set(s, STRUCTURE_ROAD)
    )

    for(let p = 1; p < path.length - 1; p++) {
      map.set(path[p], STRUCTURE_ROAD)
    }
  }

  return map.export()
}
