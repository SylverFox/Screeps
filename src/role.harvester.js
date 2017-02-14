module.exports = {
    run: function(creep) {
		/*
		* Cycle: harvesting -> hauling
		*/
		
		if(creep.memory.cycle === undefined) {
			// new creep, has no cycle yet
			creep.memory.cycle = 'harvesting';
		}
		
		
		if(creep.memory.harvestTarget === undefined) {
			// find a source that is not being used and assign it to this creep
			var sources = creep.room.find(FIND_SOURCES);
			for(let source of sources) {
				var sourceUsed = false;
				var numHarvesters = 2;
				
				for(var c in Game.creeps) {
					if(Game.creeps[c].memory.harvestTarget !== undefined && Game.creeps[c].memory.harvestTarget === source.id) {
					    numHarvesters--;
					    if(numHarvesters === 0) {
					        sourceUsed = true;
					        break;
					    }
					}
				}
				if(!sourceUsed) {
					creep.memory.harvestTarget = source.id;
					creep.say('target found');
					break;
				}
			}
		}
		
		if(creep.memory.cycle === 'harvesting') {
			if(creep.carry.energy !== creep.carryCapacity) {
				var target = Game.getObjectById(creep.memory.harvestTarget);
				if(creep.harvest(target) == ERR_NOT_IN_RANGE) {
					creep.moveTo(target);
				}
			} else {
				creep.memory.cycle = 'hauling';
				creep.say('hauling');
			}
		}
		
		if(creep.memory.cycle === 'hauling') {
			if(creep.carry.energy > 0) {
				var target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
					filter: struct => struct.energy < struct.energyCapacity
				});
				if(creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
					creep.moveTo(target, {visualizePathStyle: {
                        fill: 'transparent',
                        stroke: '#fff',
                        lineStyle: 'dashed',
                        strokeWidth: .15,
                        opacity: .1}
					});
				}
			} else {
				creep.memory.cycle = 'harvesting';
				creep.say('harvesting');
			}
		}
		
    }
};