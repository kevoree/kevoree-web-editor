var Class           = require('pseudoclass'),
    OpenWireProps   = require('../command/ui/OpenWireProps'),
    DeleteBinding   = require('../command/model/DeleteBinding'),
    RemoveSubNode   = require('../command/model/RemoveSubNode'),
    ModelHelper     = require('../util/ModelHelper');

/**
 * Created by leiko on 04/02/14.
 */
var UIWire = Class({
    toString: 'UIWire',

    construct: function (srcInstance, editor, targetInstance) {
        this.editor = editor;
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
            stroke: this.srcInstance.ui.getWireColor(),
            strokeWidth: 5,
            lineCap: 'roud',
            lineJoin: 'round',
            opacity: 0.6,
            sceneFunc: function (context) {
                var start  = this.srcInstance.ui.getPlugPosition(),
                    end    = this.targetInstance.ui.getPlugPosition(start),
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
            var droppableShapes = editor.getUI().getStage().find('.droppable-instance');
            var topLevelShape = null;
            for (var i=0; i < droppableShapes.length; i++) {
                if (droppableShapes[i].intersects(pointerPos)) {
                    if (!topLevelShape || (topLevelShape.getZIndex() < droppableShapes[i].getParent().getZIndex())) {
                        topLevelShape = droppableShapes[i].getParent();
                    } else {
                        topLevelShape = droppableShapes[i].getParent();
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
            var droppableShapes = editor.getUI().getStage().find('.droppable-instance');
            var topLevelShape = null;
            for (var i=0; i < droppableShapes.length; i++) {
                if (droppableShapes[i].intersects(pointerPos)) {
                    if (!topLevelShape || (topLevelShape.getZIndex() <= droppableShapes[i].getParent().getZIndex())) {
                        if (topLevelShape) topLevelShape.fire('mousenotover');
                        topLevelShape = droppableShapes[i].getParent();
                    }
                } else {
                    droppableShapes[i].getParent().fire('mousenotover');
                }
            }
            if (topLevelShape) topLevelShape.fire('mouseover');
        });

        this.wirePropsCmd = new OpenWireProps(editor, this);
        this.removeSubNodeCmd = new RemoveSubNode(editor);
        this.deleteBindingCmd = new DeleteBinding(editor);
    },
    
    setTarget: function (instance) {
        this.targetInstance = instance;
    },
    
    ready: function () {
        this.srcInstance.ui.addWire(this);
        this.targetInstance.ui.addWire(this);
        
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
            this.wirePropsCmd.execute(this.srcInstance, this.targetInstance);
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
                this.removeSubNodeCmd.execute(this.srcInstance, this.targetInstance);
                break;
            
            case 'port':
                var bindings = this.srcInstance.bindings.iterator();
                while (bindings.hasNext()) {
                    var binding = bindings.next();
                    if (binding.hub.name === this.targetInstance.name) {
                        this.deleteBindingCmd.execute(binding);
                    }
                }
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