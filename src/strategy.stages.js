module.exports = {
    run: function(room) {
        console.log('checking stage level');
        var currentStage = Memory.stage;
        
        if(currentStage === -1) {
            // no requirements needed
            return 0;
        } else if(currentStage === 0) {
            // requirements for stage 1: controller level 2 and two extensions
            var controllerStage = room.controller.level;
            var extensions = (room.energyCapacityAvailable - 300) / 50;
            
            if(controllerStage > 1 && extensions > 1) {
                console.log('upgrading to stage 1');
                return currentStage + 1;
            }
        } else if(currentStage === 1) {
            // requirements for stage 2: controller level 2 and containers at sources
            var controllerStage = room.controller.level;
            
            var sources = room.find(FIND_SOURCES);
            var allHaveContainers = true;
            for(var i = 0; i < sources.length; i++) {
                var area = room.lookForAtArea(LOOK_STRUCTURES, sources[i].pos.y-1, sources[i].pos.x-1, sources[i].pos.y+1, sources[i].pos.x+1, true);
                var hasContainer = false;
                for(var j = 0; j < area.length; j++) {
                    if(area[j].type === 'structure') {
                        hasContainer = true;
                        
                        // add this container to memory
                        for(var k = 0; k < room.memory.sources.length; k++) {
                            if(room.memory.sources[k].id === sources[i].id && room.memory.sources[k].container === undefined) {
                                room.memory.sources[k].container = area[j].id;
                            }
                        }
                        
                    }
                }
                if(!hasContainer) {
                    console.log('source '+sources[i].id+' has no container');
                    allHaveContainers = false;
                }
                
                if(room.controller.level > 1 && allHaveContainers) {
                    console.log("upgrading to stage 2");
                    return currentStage + 1;
                }
            }
        } else if(currentStage === 2) {
            // requires 3 ancillary sources
            var spawn = room.find(FIND_MY_SPAWNS)[0].pos;
            var containers = room.lookForAtArea(LOOK_STRUCTURES, spawn.y-2, spawn.x-2, spawn.y+2, spawn.x+2, true)
                .filter(s => s.structure.structureType === STRUCTURE_CONTAINER)
                .map(s => s.structure.id);
            
            if(containers.length > 0) {
                // add to memory if not yet present
                if(!room.memory.ancillaryStorage) {
                    room.memory.ancillaryStorage = [];
                }
                
                for(var container of containers) {
                    if(!room.memory.ancillaryStorage.includes(container)) {
                        room.memory.ancillaryStorage.push(container);
                    }
                }
            }
            
            if(containers.length >= 3) {
                console.log('upgrading to stage 3');
                return currentStage + 1;
            } else {
                var missing = containers.length ? 3 - containers.length : 3;
                console.log('missing '+missing+' ancillary containers for next stage');
            }
        } else if(currentStage === 3) {
            // check for towers
            var towers = room.find(FIND_MY_STRUCTURES)
                .filter(s => s.structureType === STRUCTURE_TOWER)
                .map(s => s.id);

            if(towers.length > 0) {
                if(!room.memory.towers) {
                    room.memory.towers = [];
                }

                for(var tower in towers) {
                    if (!room.memory.towers.includes(tower)) {
                        room.memory.towers.push(tower);
                    }
                }

                console.log('upgrading to stage 4');
                return currentStage + 1;
            } else {
                console.log('missing tower for next stage');
            }

        } else if(currentStage === 4) {

        }
        
        // requirements for next stage not met, stay on current stage
        return currentStage;
    }
};