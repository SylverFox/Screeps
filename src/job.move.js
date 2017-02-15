const tools = require('tools');

module.exports = {
    moveTo: function(creep, target) {
        if(creep.pos.x === target.pos.x && creep.pos.y === target.pos.y) {
            return this.JOB_DONE;
        }

        const res = creep.moveTo(target, {reusePath: 5, visualizePathStyle: tools.visualizePathStyle});
        if(res !== OK) {
            return this.NO_ACTION_DONE;
        }

        const newRange = tools.rangeTo(creep.pos,target.pos);

        if(range === 1) {
            console.log('job done after move');
            return this.JOB_DONE;
        } else {
            return this.ACTION_DONE;
        }
    },

    moveToInRange: function(creep, target, range) {

    },

    JOB_DONE: 0,
    ACTION_DONE: 1,
    NO_ACTION_DONE: 2,
};
