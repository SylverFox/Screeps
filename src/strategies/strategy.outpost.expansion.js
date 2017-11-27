const MAX_PROJECTS = 10

exports.run = function(outpost) {
  if(!outpost.memory.constructionPlan) {
    // build new construction plan
    outpost.memory.constructionPlan = buildConstructionPlan(outpost)
  }

  const maxP = MAX_PROJECTS - outpost.constructionSites.length
  if(maxP <= 0) {
    return
  }
  // retrieve next construction jobs
  let jobs = []
  for (let plan of outpost.memory.constructionPlan) {
    const blocked = new RoomPosition(...plan.pos).look().filter(s =>
      [LOOK_CONSTRUCTION_SITES, LOOK_STRUCTURES].includes(s.type)
    ).length

    if (!blocked) {
      jobs.push(plan)
      if(jobs.length >= maxP) {
        return jobs
      }
    }
  }

  if(jobs.length) {
    // return last few jobs
    return jobs
  } else {
    // delete plan and rebuild in the next iteration
    delete outpost.memory.constructionPlan
  }
}

function buildConstructionPlan(outpost) {
  // construction plan builds roads from objects in the room to bases
  let constructionPlan = []

  const minerals = outpost.find(FIND_MINERALS)
  const sources = outpost.sources
  const controller = outpost.controller

  const targets = [controller, ...sources, ...minerals]
  const spawns = outpost.bases.map(b => b.spawns[0]).filter(s => s)

  for (let t of targets) {
    for (let s of spawns) {
      const path = t.pos.findPathTo(s, {ignoreCreeps: true})
      // add all paths except last (on border)
      for (let i = 0; i < path.length - 1; i++) {
        constructionPlan.push({
          pos: [path[i].x, path[i].y, outpost.name],
          type: STRUCTURE_ROAD
        })
      }
    }
  }

  return constructionPlan
}
