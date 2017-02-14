const _ = require('lodash');
const rHarvester = require('role.harvester');
const rBuilder = require('role.builder');
const rUpgrader = require('role.upgrader');
const rRepairer = require('role.repairer');
const rMiner = require('role.miner');
const rTransporter = require('role.transporter');
const rOutsideHarvester = require('role.outsideHarvester');
const sSpawning = require('strategy.spawning');
const sStages = require('strategy.stages');
const sExpansion = require('strategy.expansion');
const rTower = require('tower');
const iBaseIndexer = require('intel.baseIndexer');

module.exports.loop = function() {
	const spawn = Game.spawns.Spawn1;
	// energy storage percentage
	Memory.energyPercentage = spawn.room.energyAvailable / spawn.room.energyCapacityAvailable;
	
	// index living creeps
	let creepCount = {
        'harvester': 0,
        'builder': 0,
        'upgrader': 0,
        'repairer': 0,
        'miner': 0,
        'transporter': 0,
        'outsideHarvester': 0
    };
	for(let i in Memory.creeps) {
		if(!Game.creeps[i]) {
			// creep has died
			delete Memory.creeps[i];
		} else {
			creepCount[Game.creeps[i].memory.role]++;
		}
	}
	
	
	
	
	
	if(Game.time %10 === 0) {
	    // do this every 10 ticks
	}
	
	if(Game.time % 100 === 0) {
	    // do this every 100 ticks
	    if(Memory.stage === undefined) {
	        /* first run, do everything for the first time here */
	        console.log('doing first run');
	        Memory.stage = -1;
	        
	        spawn.room.memory.sources = [];
	        for(let source of spawn.room.find(FIND_SOURCES)) {
	            spawn.room.memory.sources.push({id: source.id});
	        }
	        
	    }
	    // run indexing of base
	    iBaseIndexer.run(spawn.room);

	    // check for current stage
	    const oldStage = Memory.stage;
	    Memory.stage = sStages.run(spawn.room);
	    if(Memory.stage > oldStage) {
	        console.log('new stage \\o/');
	    }

	    // run expansion strategies
        sExpansion.run(spawn.room);
	}
	
	// check if we need more creeps
	const [needSpawn, body, memory] = sSpawning.run(creepCount);
	if(needSpawn && Memory.energyPercentage === 1) {
        spawn.createCreep(body, null, memory);
	}
	
	// creep jobs
	for(let i in Game.creeps) {
		const creep = Game.creeps[i];
		if(creep.memory.role === 'harvester') {
			rHarvester.run(creep);
		} else if(creep.memory.role === 'miner') {
		    rMiner.run(creep);
		} else if(creep.memory.role === 'builder') {
		    rBuilder.run(creep, needSpawn ? 'ancillary' : 'main');
		} else if(creep.memory.role === 'upgrader') {
			rUpgrader.run(creep, needSpawn ? 'ancillary' : 'main');
		} else if(creep.memory.role === 'repairer') {
			rRepairer.run(creep, needSpawn ? 'ancillary' : 'main');
		} else if(creep.memory.role === 'transporter') {
		    rTransporter.run(creep);
		} else if(creep.memory.role === 'outsideHarvester') {
		    rOutsideHarvester.run(creep);
        }
	}

	// tower jobs
    if(spawn.room.memory.towers) {
	    for(let tower of spawn.room.memory.towers) {
	        rTower.run(Game.getObjectById(tower));
        }

    }
};