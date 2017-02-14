module.exports = {
    visualizePathStyle: {
        fill: 'transparent',
        stroke: '#fff',
        lineStyle: 'dashed',
        strokeWidth: .15,
        opacity: .1
    },

    repairEffectiveness: function(tower, target) {
        const towerPos = tower.pos;
        const targetPos = target.pos;

        const dx = Math.abs(towerPos.x - targetPos.x);
        const dy = Math.abs(towerPos.y - targetPos.y);

        const range = Math.floor(Math.sqrt(Math.pow(dx,2) + Math.pow(dy,2)));

        if(range <= 5) {
            return 800;
        } else if(range >= 20) {
            return 200;
        } else {
            return 800 - (range-5)*40;
        }
    }
};