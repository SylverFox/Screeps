module.exports = {
    run: function(creep, source) {
		
		/*
		* Cycle: refilling -> building
		*/
		
		if(creep.memory.cycle === undefined) {
			// new creep, has no cycle yet
			creep.memory.cycle = 'refilling';
		}
		
		if(creep.memory.cycle === 'refilling') {
			if(creep.carry.energy < creep.carryCapacity) {
			    // TODO optimize
				var ancillary = creep.room.memory.ancillaryStorage
				    .map(as => Game.getObjectById(as))
				    .filter(as => as.store[RESOURCE_ENERGY] > 0);
				if(ancillary) {
				    var target = ancillary[0];
				} else if(source === 'main') {
				    var target = Game.spawns['Spawn1'];
				} else {
				    // no ancillary source and not allowed from main power grid
				    return;
				}
			    if(creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
				    creep.moveTo(target);
				}
				
			} else {
				creep.memory.cycle = 'building';
				creep.say('building');
			}
		}
		
		if(creep.memory.cycle === 'building') {
			if(creep.carry.energy > 0) {
				var target = creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES);
				if(target) {
					if(creep.build(target) == ERR_NOT_IN_RANGE) {
						creep.moveTo(target);
					}
				}
			} else {
				creep.memory.cycle = 'refilling';
				creep.say('refilling');
			}
		}
    }
};