module.exports = {
    visualizePathStyle: {
        fill: 'transparent',
        stroke: '#fff',
        lineStyle: 'dashed',
        strokeWidth: .15,
        opacity: .1
    },

    repairEffectiveness: function(tower, target) {
        const range = this.rangeTo(tower.pos, target.pos);

        if(range <= 5) {
            return 800;
        } else if(range >= 20) {
            return 200;
        } else {
            return 800 - (range-5)*40;
        }
    },

    // todo replace with inRangeTo
    rangeTo: function(sourcePos, targetPos) {
        const dx = Math.abs(sourcePos.x - targetPos.x);
        const dy = Math.abs(sourcePos.y - targetPos.y);

        const range = Math.sqrt(Math.pow(dx,2) + Math.pow(dy,2));

        return Math.floor(range);
    }
};