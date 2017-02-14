module.exports = {
    run: function(role, energy) {
        let body = [];
        
        if(role === 'builder') {
            // TODO optimize
            if(energy < 400) {
                // simple body
                body = [WORK, CARRY, MOVE];
            } else {
                body = [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
            }
        } else if(role === 'harvester') {
            // TODO optimize
            if(energy < 400) {
                // simple body
                body = [WORK, CARRY, MOVE, MOVE];
            } else {
                body = [WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE];
            }
        } else if(role === 'upgrader' || role === 'repairer') {
            while(energy >= 200) {
                body.push(WORK);
                body.push(CARRY);
                body.push(MOVE);
                energy -= 200;
            }
            while(energy >= 150) {
                body.push(CARRY);
                body.push(CARRY);
                body.push(MOVE);
                energy -= 150;
            }
            while(energy >= 100) {
                body.push(CARRY);
                body.push(MOVE);
                energy -= 100;
            }
        } else if(role === 'transporter') {
            while(energy >= 150) {
                body.push(CARRY);
                body.push(CARRY);
                body.push(MOVE);
                energy -= 150;
            }
            while(energy >= 100) {
                body.push(CARRY);
                body.push(MOVE);
                energy -= 100;
            }
        } else if(role === 'miner') {
            body.push(MOVE);
            energy -= 50;

            let maxWorkParts = 5;
            while(energy >= 100 && maxWorkParts > 0) {
                body.push(WORK);
                energy -= 100;
                maxWorkParts--;
            }
        } else if(role === 'outsideHarvester') {
            //TODO optimize
            while(energy >= 250) {
                body.push(WORK);
                body.push(CARRY);
                body.push(MOVE);
                body.push(MOVE);
                energy -= 250;
            }

            while(energy >= 100) {
                body.push(CARRY);
                body.push(MOVE);
                energy -= 100;
            }
        } else {
            console.log('strategy.creepbody: Invalid role given');
            // default body
            body = [WORK, CARRY, MOVE];
        }
        
        return body;
    }
};