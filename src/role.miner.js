module.exports = {
    run: function(creep) {
		/*
		* Cycle: harvesting
		*/
		
		if(creep.memory.harvestTarget === undefined) {
			// find a source that is not being used and assign it to this creep
			var sources = creep.room.find(FIND_SOURCES);
			for(let source of sources) {
				var sourceUsed = false;
				
				for(var c in Game.creeps) {
					if(Game.creeps[c].memory.harvestTarget !== undefined && Game.creeps[c].memory.harvestTarget === source.id) {
						sourceUsed = true;
						break;
					}
				}
				if(!sourceUsed) {
					creep.memory.harvestTarget = source.id;
					creep.say('target found');
					break;
				}
			}
		}
		
		var target = Game.getObjectById(creep.memory.harvestTarget);
		
		if(creep.harvest(target) == ERR_NOT_IN_RANGE) {
			creep.moveTo(target);
		}
		
		if(creep.carry.energy === creep.carryCapacity) {
			creep.drop(RESOURCE_ENERGY);
		}
    }
};