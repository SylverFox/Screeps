const _ = require('lodash');

module.exports = {

    findClosestDroppedResource: function(creep) {
        const sourcePos = creep.pos;
        return sourcePos.findClosestByPath(FIND_DROPPED_RESOURCES);
    },

    findFullestSourceContainer: function(creep) {
        const sourcePos = creep.pos;
        const sources = Game.rooms[sourcePos.roomName].memory.sources;
        if(sources) {
            let containers = [];
            _.each(sources, s => {
                if(s.container) {
                    containers.push(s.container);
                }
            });

            if(containers.length > 0) {
                const transporters = _.filter(Game.creeps, c =>
                    c.memory.role === 'transporter' && c.id !== creep.id && c.memory.transportSource)
                    .map(c => c.memory.transportSource);

                const containerObjects = containers
                    .map(c => Game.getObjectById(c))
                    .filter(c => !transporters.includes(c.id))
                    .sort((c1, c2) => _.sum(c2.store) - _.sum(c1.store));

                if(containerObjects.length > 0) {
                    return containerObjects[0];
                }
            }
        }
    },

    findClosestFullContainer: function(creep) {
        const sourcePos = creep.pos;
        const sources = Game.rooms[sourcePos.roomName].memory.sources;
        if(sources) {
            let containers = [];
            _.each(sources, s => {
                if(s.container) {
                    containers.push(s.container);
                }
            });

            if(containers.length > 0) {
                const transporters = _.filter(Game.creeps, c =>
                c.memory.role === 'transporter' && c.id !== creep.id && c.memory.transportSource)
                    .map(c => c.memory.transportSource);

                const containerObjects = containers
                    .map(c => Game.getObjectById(c))
                    .filter(c => !transporters.includes(c.id))
                    .filter(c => _.sum(c.store) === c.storeCapacity);

                if(containerObjects.length > 0) {
                    return sourcePos.findClosestByPath(containerObjects);
                }
            }
        }
    },

    findBestTransportSource: function(creep) {
        let closestSource;

        closestSource = this.findClosestFullContainer(creep);

        if(!closestSource) {
            closestSource = this.findClosestDroppedResource(creep);
        }

        if(!closestSource) {
            closestSource = this.findFullestSourceContainer(creep);
        }

        if(closestSource) {
            return closestSource;
        }
    },

    findAvailableMiningSource: function(creep) {
        const sourcesUsed = _.filter(Game.creeps, c =>
            c.memory.role === 'miner' && c.id != creep.id && c.memory.harvestTarget
        ).map(c => c.memory.harvestTarget);

        if(creep.room.memory.sources) {
            const sources = _.filter(creep.room.memory.sources,
                s => s.container && !sourcesUsed.includes(s.container)
            ).map(s => s.container);

            if (sources.length) {
                return sources[0];
            }
        }
    }
};