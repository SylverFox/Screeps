/*
 * Gathers intel from flags and handles strategy
 */

module.exports = {
    run: function(room) {
        for(let flag in Game.flags) {
            if(flag.startsWith('outsideSource')) {
                // handle outside source
                const flagPos = JSON.stringify(Game.flags[flag].pos);

                if(!Memory.outsideSources.length > 0) {
                    Memory.outsideSources = [];
                }

                if(!Memory.outsideSources.includes(flagPos)) {
                    Memory.outsideSources.push(flagPos);
                }
            } else {
                console.log(`Unknown flag ${flag}`);
            }
        }
    }
};