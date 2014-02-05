var AbstractEntity = require('./AbstractEntity');

/**
 * Created by leiko on 04/02/14.
 */
var UIWire = AbstractEntity.extend({
    toString: 'AbstractEntity',

    construct: function (grpInstance, editor, nodeInstance) {
        function computeMiddle(start, end) {
            var middleX, middleY;

            if (start.x > end.x) middleX = end.x + (start.x - end.x)/2;
            else middleX = start.x + (end.x - start.x)/2;

            middleY = ((start.y >= end.y) ? start.y : end.y) + 30;

            return { x: middleX, y: middleY };
        }

        this.shape = new Kinetic.Shape({
            id: (nodeInstance) ? '' : 'temp-wire',
            stroke: '#5aa564',
            strokeWidth: 4,
            lineCap: 'roud',
            lineJoin: 'round',
            opacity: 0.6,
            sceneFunc: function (context) {
                var start  = editor.getUI().getUIInstance(grpInstance.path()).getPlugPosition(),
                    end    = editor.getUI().getUIInstance(nodeInstance.path()).getPlugPosition(),
                    middle = computeMiddle(start, end);
                context.beginPath();
                context.moveTo(start.x, start.y);
                context.quadraticCurveTo(middle.x, middle.y, end.x, end.y);
                context.fillStrokeShape(this);
                context.fillShape(this);
                context.strokeShape(this);
                context.closePath();
            }
        });

        this.shape.on('mouseover', function () {
            if (this.shape.getLayer()) {
                this.shape.setStrokeWidth(6);
                this.shape.getLayer().batchDraw();
            }
        }.bind(this));

        this.shape.on('mouseout', function () {
            if (this.shape.getLayer()) {
                this.shape.setStrokeWidth(4);
                this.shape.getLayer().batchDraw();
            }
        }.bind(this));
    }
});

module.exports = UIWire;