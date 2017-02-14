const _ = require('lodash');

module.exports = {
    findPrimaryStorages: function(room) {
        let storages = [];
        room.find(FIND_MY_STRUCTURES)
            .filter(s => [STRUCTURE_EXTENSION,STRUCTURE_SPAWN].includes(s.structureType))
            .filter(s => s.energy < s.energyCapacity)
            .forEach(s => storages.push(s));
        return storages;
    },

    findSupplyStorages: function(room) {
        let storages = [];
        room.find(FIND_MY_STRUCTURES)
            .filter(s => s.structureType === STRUCTURE_TOWER)
            .filter(s => s.energy < s.energyCapacity * 0.90)
            .forEach(s => storages.push(s));
        return storages;
    },

    findAncillaryStorages: function(room) {
        let storages = [];
        if(room.memory.ancillaryStorage) {
            room.memory.ancillaryStorage
                .map(s => Game.getObjectById(s))
                .filter(s => _.sum(s.store) < s.storeCapacity)
                .forEach(s => storages.push(s));
        }
        return storages;
    },

    findClosestAncillaryStorage: function(sourcePos) {
        let storages = [];

        if(Game.rooms[sourcePos.roomName]) {
            // find in current room first
            storages = this.findAncillaryStorages(Game.rooms[sourcePos.roomName]);
        }

        if(!storages.length > 0) {
           // get storages for all rooms
            Object.keys(Game.rooms).map(room => Game.rooms[room]).forEach(
                room => storages = storages.concat(this.findAncillaryStorages(room))
            );
        }

        if(storages.length > 0) {
            return sourcePos.findClosestByPath(storages);
        }
    },

    findClosestPrimaryStorage: function(sourcePos) {
        let storages = [];

        if(Game.rooms[sourcePos.roomName]) {
            // find in current room first
            storages = this.findPrimaryStorages(Game.rooms[sourcePos.roomName]);
        }

        if(!storages.length > 0) {
            // get storages for all rooms
            Object.keys(Game.rooms).map(room => Game.rooms[room]).forEach(
                room => storages = storages.concat(this.findPrimaryStorages(room))
            );
        }

        if(storages.length > 0) {
            return sourcePos.findClosestByPath(storages);
        }
    },

    findClosestsupplyStorage: function(sourcePos) {
        let storages = [];

        if(Game.rooms[sourcePos.roomName]) {
            // find in current room first
            storages = this.findSupplyStorages(Game.rooms[sourcePos.roomName]);
        }

        if(!storages.length > 0) {
            // get storages for all rooms
            Object.keys(Game.rooms).map(room => Game.rooms[room]).forEach(
                room => storages = storages.concat(this.findSupplyStorages(room))
            );
        }

        if(storages.length > 0) {
            return sourcePos.findClosestByPath(storages);
        }
    },

    // TODO bug with findClosestByPath in different rooms
    // TODO check for carry type
    findBestStorage: function(sourcePos) {
        let closestStorage;

        closestStorage = this.findClosestPrimaryStorage(sourcePos);

        if(!closestStorage) {
            closestStorage = this.findClosestsupplyStorage(sourcePos);
        }

        if(!closestStorage) {
            closestStorage = this.findClosestAncillaryStorage(sourcePos);
        }

        if(closestStorage) {
            return closestStorage;
        }
    }
};
