const tStorage = require('targeting.storage');
const tSource = require('targeting.source');
const _ = require('lodash');

module.exports = {
    run: function(creep) {
        if(creep.spawning) {
            return;
        }
        if(creep.memory.dying) {
            if(_.sum(creep.carry) === 0) {
                // recycle
                const spawn = creep.room.find(FIND_MY_SPAWNS)[0];
                const res = spawn.recycleCreep(creep);
                if(res === ERR_NOT_IN_RANGE) {
                    creep.moveTo(spawn);
                }
            } else {
                const storageTarget = tStorage.findBestStorage(creep.pos);
                if(storageTarget) {
                    if(creep.transfer(storageTarget) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(storageTarget);
                    }
                }
            }
            return;
        } else if(creep.ticksToLive < 50) {
            // creep is dying
            creep.memory.dying = true;
        }
        /*
		* Cycle: searching -> transporting
		*/
		
		if(creep.memory.cycle === undefined) {
			// new creep, has no cycle yet
			creep.memory.cycle = 'searching';
		}
		
		if(creep.memory.cycle === 'searching') {
			if(creep.carry.energy < creep.carryCapacity) {
				if(creep.memory.transportSource) {
				    // pickup from source
				    var source = Game.getObjectById(creep.memory.transportSource);
				    if(!source) {
				        // source has been removed
				        delete creep.memory.transportSource;
				        return;
                    }

				    if(source.resourceType) {
				    	var res = creep.pickup(source);
					} else {
                        var res = creep.withdraw(source, RESOURCE_ENERGY)
					}

				    if(res === ERR_NOT_IN_RANGE) {
				        creep.moveTo(source);
				    } else if(res === ERR_NOT_ENOUGH_RESOURCES) {
				        // empty, pick new resource
				        delete creep.memory.transportSource;
				    } else if(res !== OK) {
				        console.log(creep.name+': error on finding energy source - '+res);
				    }
				} else {
				    // find source
                    const target = tSource.findBestTransportSource(creep);
                    if(target) {
                        creep.memory.transportSource = target.id;
                        creep.moveTo(target);
                    } else {
                        console.log(`${creep.name}: no target for source`);
                    }
				}
			} else {
				creep.memory.cycle = 'transporting';
				delete creep.memory.transportSource;
				creep.say('transporting');
			}
		}
		
		if(creep.memory.cycle === 'transporting') {
			if(creep.carry.energy > 0) {
				if(creep.memory.transportDestination) {
				    // dump in destination
				    const target = Game.getObjectById(creep.memory.transportDestination);

				    if(target.energy + creep.carry[RESOURCE_ENERGY] >= target.energyCapacity) {
				        // will fill up target, delete from memory
				        delete creep.memory.transportDestination;
                    }

				    const res = creep.transfer(target, RESOURCE_ENERGY);
				    
				    if(res === ERR_NOT_IN_RANGE) {
				        creep.moveTo(target);
				    } else if(res === ERR_FULL) {
				        delete creep.memory.transportDestination;
				    }
				} else {
				    // find destination
				    const target = tStorage.findBestStorage(creep.pos);
				    
				    if(target) {
				        creep.memory.transportDestination = target.id;
				        creep.moveTo(target);
				    } else {
				        console.log(`${creep.name}: nothing to transport energy to`);
				    }
				}
			} else {
				creep.memory.cycle = 'searching';
				delete creep.memory.transportDestination;
				creep.say('searching');
			}
		}
    }
};