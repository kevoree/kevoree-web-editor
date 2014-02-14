var Class               = require('pseudoclass'),
    OpenInstanceProps   = require('../command/ui/OpenInstanceProps'),
    ModelHelper         = require('../util/ModelHelper');

/**
 * Created by leiko on 04/02/14.
 */
var UIWire = Class({
    toString: 'UIWire',

    construct: function (srcInstance, editor, targetInstance) {
        this.srcInstance = srcInstance;
        var pointerPos = editor.getUI().getStage().getPointerPosition();
        this.targetInstance = targetInstance || {
            ui: {
                getPlugPosition: function () {
                    if (editor.getUI().getStage().getPointerPosition()) {
                        pointerPos = editor.getUI().getStage().getPointerPosition();
                    }
                    return pointerPos;
                }
            }
        };
        
        function computeMiddle(start, end) {
            var middleX, middleY;

            if (start.x > end.x) middleX = end.x + (start.x - end.x)/2;
            else middleX = start.x + (end.x - start.x)/2;

            middleY = ((start.y >= end.y) ? start.y : end.y) + 30;

            return { x: middleX, y: middleY };
        }

        this.shape = new Kinetic.Shape({
            stroke: '#5aa564',
            strokeWidth: 5,
            lineCap: 'roud',
            lineJoin: 'round',
            opacity: 0.6,
            sceneFunc: function (context) {
                var start  = this.srcInstance.ui.getPlugPosition(),
                    end    = this.targetInstance.ui.getPlugPosition(),
                    middle = computeMiddle(start, end);
                context.beginPath();
                context.moveTo(start.x, start.y);
                context.quadraticCurveTo(middle.x, middle.y, end.x, end.y);
                context.quadraticCurveTo(middle.x, middle.y, start.x, start.y);
                context.fillStrokeShape(this.shape);
                context.fillShape(this.shape);
                context.strokeShape(this.shape);
                context.closePath();
            }.bind(this)
        });
        
        this.shape.on('mouseup', function (e) {
            var pointerPos = editor.getUI().getStage().getPointerPosition();
            var nodeShapes = editor.getUI().getStage().find('.node-instance');
            var topLevelShape = null;
            for (var i=0; i < nodeShapes.length; i++) {
                if (nodeShapes[i].intersects(pointerPos)) {
                    if (!topLevelShape || (topLevelShape.getZIndex() < nodeShapes[i].getParent().getZIndex())) {
                        topLevelShape = nodeShapes[i].getParent();
                    } else {
                        topLevelShape = nodeShapes[i].getParent();
                    }
                }
            }
            if (topLevelShape) topLevelShape.fire('mouseup');
            
            if (editor.getDraggedElement()) {
                // if we end-up here it means that no node took this wire in charge => get rid of it
                var wiresLayer = this.shape.getLayer();
                this.shape.destroy();
                wiresLayer.batchDraw();
                editor.setDraggedElement(null);
            }
        }.bind(this));
        
        this.shape.on('mousemove', function () {
            var pointerPos = editor.getUI().getStage().getPointerPosition();
            var nodeShapes = editor.getUI().getStage().find('.node-instance');
            var topLevelShape = null;
            for (var i=0; i < nodeShapes.length; i++) {
                if (nodeShapes[i].intersects(pointerPos)) {
                    if (!topLevelShape || (topLevelShape.getZIndex() <= nodeShapes[i].getParent().getZIndex())) {
                        if (topLevelShape) topLevelShape.fire('mousenotover');
                        topLevelShape = nodeShapes[i].getParent();
                    }
                } else {
                    nodeShapes[i].getParent().fire('mousenotover');
                }
            }
            if (topLevelShape) topLevelShape.fire('mouseover');
        });

        this.instPropsCmd = new OpenInstanceProps(editor, this);
    },
    
    setTarget: function (instance) {
        this.targetInstance = instance;
    },
    
    ready: function () {
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
        
        this.shape.on('click', function (e) {
            this.instPropsCmd.execute(this.srcInstance, this.targetInstance);
            e.cancelBubble = true;
        }.bind(this));
    },
    
    getSrcInstance: function () {
        return this.srcInstance;
    },
    
    onDelete: function () {
        console.log('onDelete UIWire');
        var srcType = ModelHelper.findInstanceType(this.srcInstance);
        
        switch (srcType) {
            case 'group':
                this.srcInstance.removeSubNodes(this.targetInstance);
                break;
            
            case 'port':
                console.log('TODO REMOVE WIRE FROM PORT <-> CHAN');
                // TODO
                break;
            
            default:
                console.warn('Unhandled srcType for UIWire: '+srcType);
                break;
        }
        this.shape.destroy();
    },
    
    getShape: function () {
        return this.shape;
    }
});

module.exports = UIWire;