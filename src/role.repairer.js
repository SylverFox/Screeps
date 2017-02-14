module.exports = {
    run: function(creep, source) {
        /*
		* Cycle: refilling -> repairing
		*/
		
		if(creep.memory.cycle === undefined) {
			// new creep, has no cycle yet
			creep.memory.cycle = 'refilling';
		}
		
		if(creep.memory.cycle === 'refilling') {
			if(creep.carry.energy < creep.carryCapacity) {
				
				var res = creep.withdraw(Game.spawns['Spawn1'], RESOURCE_ENERGY);
				if(res === ERR_NOT_IN_RANGE) {
					creep.moveTo(Game.spawns['Spawn1']);
				}
			} else {
				creep.memory.cycle = 'repairing';
				creep.say('repairing');
			}
		}
		
		if(creep.memory.cycle === 'repairing') {
			if(creep.carry.energy > 0) {
			    if(!creep.memory.repairTarget) {
			        var structures = creep.room.find(FIND_STRUCTURES)
						.filter(s => s.structureType !== STRUCTURE_WALL)
			            .filter(s => s.hits < s.hitsMax);

			        var walls = creep.room.find(FIND_STRUCTURES)
                        .filter(s => s.structureType === STRUCTURE_WALL)
                        .filter(s => s.hits <= 100000);

			        structures.concat(walls);
			        structures = structures.sort((s1,s2) => (s1.hits/s1.hitsMax)-(s2.hits/s2.hitsMax));

				    if(structures.length > 0) {
				        creep.memory.repairTarget = structures[0].id;
				    }
			    }
				
				if(creep.memory.repairTarget) {
				    var target = Game.getObjectById(creep.memory.repairTarget);

				    if(target.hits === target.hitsMax) {
				        delete creep.memory.repairTarget;
                    } else if(creep.repair(target) == ERR_NOT_IN_RANGE) {
						creep.moveTo(target);
					}
				} else {
					// nothing to repair
				}
			} else {
			    delete creep.memory.repairTarget;
				creep.memory.cycle = 'refilling';
				creep.say('refilling');
			}
		}
    }
};