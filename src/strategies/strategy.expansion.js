const ConstructionPlanner = require('./utils.constructionplanner')

module.exports.run = function(base) {
  const constructionplanner = new ConstructionPlanner(base)

  if (!base.memory.constructionPlan) {
     constructionplanner.build()
  }

  return constructionplanner.retrieve(10)
}
