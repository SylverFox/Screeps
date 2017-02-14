const tools = require('tools');

module.exports = {
    run: function(tower) {
        // find targets to shoot at
        const enemies = tower.room.find(FIND_HOSTILE_CREEPS)
            .sort((c1,c2) => c1.hits - c2.hits);

        if(enemies.length > 0) {
            tower.attack(enemies[0]);
            Game.notify(`Creep from ${enemies[0].owner.username} spotted`);
            return;
        }

        // find creeps to heal
        const damagedCreeps = tower.room.find(FIND_MY_CREEPS)
            .filter(c => c.hits < c.hitsMax)
            .sort((c1,c2) => c1.hits - c2.hits);

        if(damagedCreeps.length > 0) {
            tower.heal(damagedCreeps[0]);
            return;
        }

        // repair stuff
        if(tower.energy < tower.energyCapacity * 0.50) {
            return;
        }
        let structures = tower.room.find(FIND_STRUCTURES)
            .filter(s => s.hits < 100000)
            .filter(s => s.hits < s.hitsMax - tools.repairEffectiveness(tower,s));

        if(!structures.length > 0) {
            // no structures to repair, upgrade walls
            structures = tower.room.find(FIND_STRUCTURES)
                .filter(s => s.hits < 245000);
        }

        structures = structures.sort((s1,s2) => (s1.hits/s1.hitsMax)-(s2.hits/s2.hitsMax));

        if(structures.length > 0) {
            tower.repair(structures[0]);
        }

    }
};