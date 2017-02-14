const _ = require('lodash');
const tools = require('tools');

module.exports = {
    run: function(creep) {
        if(creep.spawning) return;
        /*
         * Cycle: harvesting -> hauling
         */

        if(creep.memory.cycle === undefined) {
            // new creep, has no cycle yet
            creep.memory.cycle = 'harvesting';
        }


        if(creep.memory.harvestTarget === undefined) {
            // find a source that is not being used and assign it to this creep
            for(let source of Memory.outsideSources) {
                let sourceUsed = false;
                let numHarvesters = 1; // TODO increase if working

                const outsideHarvesters = _.filter(Game.creeps, {memory: {role: 'outsideHarvester'}});
                for(let oh of outsideHarvesters) {
                    if(oh.memory.harvestTarget !== undefined && oh.memory.harvestTarget === source) {
                        numHarvesters--;
                        if(numHarvesters === 0) {
                            sourceUsed = true;
                            break;
                        }
                    }
                }
                if(!sourceUsed) {
                    creep.memory.harvestTarget = source;
                    creep.say('target found');
                    break;
                }
            }
        }

        if(creep.memory.cycle === 'harvesting') {
            if(creep.carry.energy !== creep.carryCapacity) {
                const harvestTarget = JSON.parse(creep.memory.harvestTarget);
                const sourcePos = new RoomPosition(harvestTarget.x, harvestTarget.y, harvestTarget.roomName);

                if(sourcePos.roomName !== creep.room.name) {
                    creep.moveTo(sourcePos, {reusePath: 10, visualizePathStyle: tools.visualizePathStyle});
                    return;
                }

                const sourceStructure = sourcePos.lookFor(LOOK_SOURCES);

                if(!sourceStructure.length) {
                    console.log(`no source found at position ${sourcePos}`);
                }

                if(creep.harvest(sourceStructure[0]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(sourcePos, {reusePath: 10, visualizePathStyle: tools.visualizePathStyle});
                }
            } else {
                creep.memory.cycle = 'hauling';
                creep.say('hauling');
            }
        }

        if(creep.memory.cycle === 'hauling') {
            if(creep.carry.energy > 0) {
                if(creep.memory.transportDestination) {
                    // dump in destination
                    var target = Game.getObjectById(creep.memory.transportDestination);

                    if(target.structureType === STRUCTURE_TOWER && target.energy / target.energyCapacity > 0.90) {
                        // find new target, temporary solution
                        delete creep.memory.transportDestination;
                    }

                    var res = creep.transfer(target, RESOURCE_ENERGY);

                    if(res === ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, {reusePath: 10, visualizePathStyle: tools.visualizePathStyle});
                    } else if(res === ERR_FULL) {
                        delete creep.memory.transportDestination;
                    }
                } else {
                    // find destination
                    var target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                        filter: s => s.structureType !== STRUCTURE_TOWER && s.energy < s.energyCapacity
                    });

                    if (!target) {
                        target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                            filter: s => s.structureType === STRUCTURE_TOWER && s.energy < s.energyCapacity * 0.90
                        });
                    }

                    if (!target && Game.rooms.W72S85.memory.ancillaryStorage) {
                        //console.log(creep.name+': finding ancillary storage');
                        var ancStor = Game.rooms.W72S85.memory.ancillaryStorage
                            .filter(as => Game.getObjectById(as).store[RESOURCE_ENERGY] < Game.getObjectById(as).storeCapacity)
                            .map(as => Game.getObjectById(as));
                        if (ancStor.length > 0) {
                            target = ancStor[0];
                            //console.log('found one');
                        }
                    }

                    if (target) {
                        creep.memory.transportDestination = target.id;
                    } else {
                        console.log('nothing to transport energy to')
                    }
                }
            } else {
                creep.memory.cycle = 'harvesting';
                creep.say('harvesting');
            }
        }
    }
};
