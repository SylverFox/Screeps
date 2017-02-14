const _ = require('lodash');

module.exports = {
    run: function(room) {
        let roomMemory = {};

        // index sources
        roomMemory.sources = {};
        const sources = room.find(FIND_SOURCES);
        sources.forEach(s => roomMemory.sources[s.id] = {});

        // index source containers
        sources.forEach(s => {
            const containers = s.pos.findInRange(FIND_STRUCTURES, 1).filter(s => s.structureType === STRUCTURE_CONTAINER);
            if(containers.length > 0) {
                roomMemory.sources[s.id].container = containers[0].id;
            }
        });

        // index ancillary storage
        let hasAncillaryStorage = false;
        const spawnPos = room.find(FIND_MY_SPAWNS)[0].pos;
        const storages = room.lookForAtArea(LOOK_STRUCTURES, spawnPos.y-2, spawnPos.x-2, spawnPos.y+2, spawnPos.x+2, true)
            .filter(s => [STRUCTURE_CONTAINER, STRUCTURE_STORAGE].includes(s.structure.structureType))
            .map(s => s.structure.id);

        if(storages.length > 0) {
            hasAncillaryStorage = true;
            roomMemory.ancillaryStorage = [];
            storages.forEach(s => roomMemory.ancillaryStorage.push(s));
        }

        // index towers
        const towers = room.find(FIND_STRUCTURES).filter(s => s.structureType === STRUCTURE_TOWER);
        if(towers.length > 0) {
            roomMemory.towers = [];
            towers.forEach(t => roomMemory.towers.push(t.id));
        }


        /* INCREASE/DECREASE AMOUNT OF BASE BUILDERS */

        if(room.memory.maxBaseBuilders === undefined) {
            roomMemory.maxBaseBuilders = 1;
        } else {
            roomMemory.maxBaseBuilders = room.memory.maxBaseBuilders;
        }

        if(hasAncillaryStorage) {
            let stored = 0, max = 0;
            roomMemory.ancillaryStorage
                .map(as => Game.getObjectById(as))
                .map(as => [as.store[RESOURCE_ENERGY], as.storeCapacity])
                .forEach(as => {stored += as[0]; max += as[1]});

            const storagePercentage = stored / max;
            if(storagePercentage < 0.10 && roomMemory.maxBaseBuilders > 2) {
                roomMemory.maxBaseBuilders--;
            } else if(storagePercentage > 0.25) {
                roomMemory.maxBaseBuilders++;
            }
        }

        /* INCREASE/DECREASE AMOUNT OF TRANSPORTERS */

        if(room.memory.maxTransporters === undefined) {
            roomMemory.maxTransporters = 2;
        } else {
            roomMemory.maxTransporters = room.memory.maxTransporters;
        }

        // TODO make more intelligent
        const drops = room.find(FIND_DROPPED_RESOURCES).length > 0;
        let conts = false;
        if(hasAncillaryStorage) {
            conts = _.filter(room.memory.sources, s => s.container)
                .map(s => Game.getObjectById(s.container))
                .filter(c => _.sum(c.store) > 0.90 * c.storeCapacity)
                .length > 0;
        }

        if(conts) {
            // increase when there is at least one container almost full
            roomMemory.maxTransporters++;
        } else if(!drops && roomMemory.maxTransporters > 2) {
            // decrease when there are no almost full containers and no dropped resources
            roomMemory.maxTransporters--;
        }

        //update new memory
        room.memory = roomMemory;
    }
};
