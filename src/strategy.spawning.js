const sCreepBody = require('strategy.creepbody');

module.exports = {
	run: function(creepCount) {
        const spawn = Game.spawns['Spawn1'];
		const room = spawn.room;
		const maxEnergy = room.energyCapacityAvailable;
		const stage = Memory.stage;

        let body;
		
		/* HARVESTERS */
		
		// harvesters are only build in stage 0
		if(stage <= 1) {
		    // build three harvesters for each energy source
		    var neededHarvesters = room.find(FIND_SOURCES).length * 2;
		
		    if(creepCount['harvester'] < neededHarvesters) {
		        body = sCreepBody.run('harvester', maxEnergy);
		        return [true, body, {role: 'harvester'}];
		    }
		}
		
		
		/* MINERS */
		
		// stage must be 1 or larger and other harvesters dying
		if(stage > 1 && creepCount['harvester'] < 4) {
		    const neededMiners = room.find(FIND_SOURCES).length;
		    
		    if(creepCount['miner'] < neededMiners) {
		        body = sCreepBody.run('miner', maxEnergy);
		        return [true, body, {role: 'miner'}];
		    } else if(creepCount['miner'] === 0) {
		        // no miners, spawn immediately
                body = sCreepBody.run('miner', room.energyAvailable);
                return [true, body, {role: 'miner'}];
            }
		}


        /* TRANSPORTERS */
        if(stage > 1) {

            let neededTransporters = room.find(FIND_SOURCES).length;
            if(room.memory.maxTransporters !== undefined) {
                neededTransporters = room.memory.maxTransporters;
            }


            if(creepCount['transporter'] < neededTransporters) {
                body = sCreepBody.run('transporter', maxEnergy);
                return [true, body, {role: 'transporter'}];
            } else if(creepCount['transporter'] === 0) {
                body = sCreepBody.run('transporter', room.energyAvailable);
                return [true, body, {role: 'transporter'}];
            }
        }


        let maxBaseBuilders = 5;
        if(room.memory.maxBaseBuilders !== undefined) {
            maxBaseBuilders = room.memory.maxBaseBuilders;
        }

		/* BUILDERS */
		
		var neededBuilders = 0;
		// TODO increase on stage
		// stage 0: 1
		// stage 1: 2
		// build builders only if there are construction sites
		var constructionSites = room.find(FIND_CONSTRUCTION_SITES);
		if(constructionSites.length > 0) {
		    neededBuilders = Math.ceil(0.5 * maxBaseBuilders);
			if(constructionSites.length < neededBuilders) {
				neededBuilders = constructionSites.length;
			}
		    if(creepCount['builder'] < neededBuilders) {
		        body = sCreepBody.run('builder', maxEnergy);
			    return [true, body, {role: 'builder'}];
		    }
		}

		maxBaseBuilders -= neededBuilders;

        /* UPGRADERS */

        var neededUpgraders = maxBaseBuilders;
        // TODO increase on stage
        // stage 0,1: 1
        // stage 2: 2
        // stage 3: 5
        if(creepCount['upgrader'] < neededUpgraders) {
            body = sCreepBody.run('upgrader', maxEnergy);
            return [true, body, {role: 'upgrader'}];
        }
		
		/* REPAIRERS */
		
		if(stage > 1 && stage < 4) {
		    var neededRepairers = 2;
		    // TODO increase on stage
		    // stage 2: 1
		    // stage 3: 4
			// stage 4: 3
		    if(creepCount['repairer'] < neededRepairers) {
		        body = sCreepBody.run('repairer', maxEnergy);
			    return [true, body, {role: 'repairer'}];
		    }
		}


		/* OUTSIDE HARVESTERS */
		if(Memory.outsideSources.length > 0) {
		    const neededOutsideHarvesters = Memory.outsideSources.length;
            if(creepCount['outsideHarvester'] < neededOutsideHarvesters) {
                body = sCreepBody.run('outsideHarvester', maxEnergy);
                return [true, body, {role: 'outsideHarvester'}];
            }
        }
		
		// nothing needs spawning
		return [false, null, null];
	}
};