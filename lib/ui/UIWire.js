var AbstractEntity      = require('./AbstractEntity'),
    OpenInstanceProps   = require('../command/ui/OpenInstanceProps');

/**
 * Created by leiko on 04/02/14.
 */
var UIWire = AbstractEntity.extend({
    toString: 'AbstractEntity',

    construct: function (grpInstance, editor, nodeInstance) {
        this.nodeInstance = nodeInstance;
        
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
            strokeWidth: 5,
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
                context.quadraticCurveTo(middle.x, middle.y, start.x, start.y);
                context.fillStrokeShape(this);
                context.fillShape(this);
                context.strokeShape(this);
                context.closePath();
            }
        });

        this.shape.on('mouseover', function () {
            if (this.shape.getLayer()) {
                this.shape.setStrokeWidth(7);
                this.shape.getLayer().batchDraw();
            }
        }.bind(this));

        this.shape.on('mouseout', function () {
            if (this.shape.getLayer()) {
                this.shape.setStrokeWidth(5);
                this.shape.getLayer().batchDraw();
            }
        }.bind(this));
        
        var instPropsCmd = new OpenInstanceProps();
        this.shape.on('click', function (e) {
            console.log('clicked on a wire between '+grpInstance.name+' and '+nodeInstance.name);
            instPropsCmd.execute(grpInstance, nodeInstance);
            e.cancelBubble = true;
        });
    },
    
    onDelete: function () {
        
    }
});

module.exports = UIWire;