const tools = require('tools');

module.exports = {
    run: function(creep, source) {
		/*
		* Cycle: refilling -> upgrading
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
				} else {
				    var target = Game.spawns['Spawn1'];
				}
				
				var res = creep.withdraw(target, RESOURCE_ENERGY);
				if(res === ERR_NOT_IN_RANGE) {
					creep.moveTo(target);
				}
			} else {
				creep.memory.cycle = 'upgrading';
				creep.say('upgrading');
			}
		}
		
		if(creep.memory.cycle === 'upgrading') {
			if(creep.carry.energy > 0) {
				var target = creep.room.controller;
				if(creep.upgradeController(target) == ERR_NOT_IN_RANGE) {
					creep.moveTo(target, {reusePath: 10, visualizePathStyle: tools.visualizePathStyle});
				}
			} else {
				creep.memory.cycle = 'refilling';
				creep.say('refilling');
			}
		}
    }
};