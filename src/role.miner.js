const tSource = require('targeting.source');
const jMove = require('job.move');

const cycle = ['movingToSource', 'mining'];

module.exports = {
    run: function(creep) {
        if(creep.spawning) {
            return;
        }
        if(!creep.memory.cycle) {
            creep.memory.cycle = cycle[0];
        }
        if(!creep.memory.harvestTarget) {
            const target = tSource.findAvailableMiningSource(creep);
            if(target) {
                creep.memory.harvestTarget = target;
                creep.memory.harvestSource = Game.getObjectById(target).pos.findClosestByRange(FIND_SOURCES).id;
            } else {
                console.log(`${creep.name} no available source found`);
                return;
            }
        }

		let jobDone = false;

        if(creep.memory.cycle === cycle[0]) {
            const target = Game.getObjectById(creep.memory.harvestTarget);
            const res = jMove.moveTo(creep, target);

            if(res === jMove.JOB_DONE) {
                jobDone = true;
                creep.harvest(target);
            }
        } else if(creep.memory.cycle === cycle[1]) {
            const target = Game.getObjectById(creep.memory.harvestSource);
            const res = creep.harvest(target);
            if(res !== OK) {
                console.log(`${creep.name}: error while mining - ${res}`);
            }
        }

        // todo EOL sequence

        if(jobDone) {
            this.nextJob(creep);
            this.run(creep);
        }
    },

    nextJob: function(creep) {
        const idx = cycle.indexOf(creep.memory.cycle);
        creep.memory.cycle = cycle[(idx + 1) % cycle.length];
    },
};