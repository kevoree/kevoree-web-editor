var Class           = require('pseudoclass'),
    OpenWireProps   = require('../command/ui/OpenWireProps'),
    DeleteBinding   = require('../command/model/DeleteBinding'),
    RemoveSubNode   = require('../command/model/RemoveSubNode'),
    ModelHelper     = require('../util/ModelHelper'),
    UIKevWebEditor  = require('./UIKevWebEditor');

/**
 * Created by leiko on 04/02/14.
 */
var UIWire = Class({
    toString: 'UIWire',

    construct: function (srcInstance, editor, targetInstance) {
        this.editor = editor;
        this.srcInstance = srcInstance;
        if (srcInstance) {
            var pointerPos = editor.getUI().getStage().getPointerPosition();
            this.targetInstance = (function () {
                if (typeof targetInstance === 'undefined') {
                    return {
                        ui: {
                            getPlugPosition: function () {
                                if (editor.getUI().getStage().getPointerPosition()) {
                                    pointerPos = editor.getUI().getStage().getPointerPosition();
                                }
                                return pointerPos;
                            }
                        }
                    };
                } else {
                    return targetInstance;
                }
            })();

            function computeMiddle(start, end) {
                var middleX, middleY;

                if (start.x > end.x) {
                    middleX = end.x + (start.x - end.x)/2;
                } else {
                    middleX = start.x + (end.x - start.x)/2;
                }

                middleY = ((start.y >= end.y) ? start.y : end.y) + 30;

                return { x: middleX, y: middleY };
            }

            this.shape = new Kinetic.Shape({
                stroke: this.srcInstance.ui.getWireColor(),
                strokeWidth: 5,
                lineCap: 'round',
                lineJoin: 'round',
                opacity: 0.4,
                sceneFunc: function (context) {
                    var start    = this.srcInstance.ui.getPlugPosition(),
                        end      = this.targetInstance.ui.getPlugPosition(start),
                        middle   = computeMiddle(start, end);

                    var stagePos = {x: 0, y: 0},
                        scale = {x: 1, y: 1},
                        stage = this.srcInstance.ui.getShape().getStage();
                    if (stage) {
                        stagePos = stage.getPosition();
                        scale    = stage.scale();
                    }

                    start.x  -= stagePos.x;
                    start.y  -= stagePos.y;
                    end.x    -= stagePos.x;
                    end.y    -= stagePos.y;
                    middle.x -= stagePos.x;
                    middle.y -= stagePos.y;

                    context.beginPath();
                    context.moveTo(start.x/scale.x, start.y/scale.y);
                    context.quadraticCurveTo(middle.x/scale.x, middle.y/scale.y, end.x/scale.x, end.y/scale.y);
                    context.quadraticCurveTo(middle.x/scale.x, middle.y/scale.y, start.x/scale.x, start.y/scale.y);
                    context.fillStrokeShape(this.shape);
                    context.fillShape(this.shape);
                    context.strokeShape(this.shape);
                }.bind(this)
            });

            this.shape.on('mouseup touchend', function (e) {
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
                if (topLevelShape) {
                    topLevelShape.fire('mouseup');
                }

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
                            if (topLevelShape) {
                                topLevelShape.fire('mousenotover');
                            }
                            topLevelShape = droppableShapes[i].getParent();
                        }
                    } else {
                        droppableShapes[i].getParent().fire('mousenotover');
                    }
                }
                if (topLevelShape) {
                    topLevelShape.fire('mouseover');
                }
            });

            this.wirePropsCmd = new OpenWireProps(editor, this);
            this.removeSubNodeCmd = new RemoveSubNode(editor);
            this.deleteBindingCmd = new DeleteBinding(editor);
        }
    },
    
    setTarget: function (instance) {
        this.targetInstance = instance;
    },
    
    ready: function () {
        if (this.srcInstance) {
            this.srcInstance.ui.addWire(this);
            this.targetInstance.ui.addWire(this);

            this.shape.on('mouseover', function () {
                document.body.style.cursor = 'pointer';
                if (this.shape.getLayer()) {
                    this.shape.setStrokeWidth(7);
                    this.shape.getLayer().batchDraw();
                }
            }.bind(this));

            this.shape.on('mouseout', function () {
                document.body.style.cursor = 'default';
                if (this.shape.getLayer()) {
                    this.shape.setStrokeWidth(5);
                    this.shape.getLayer().batchDraw();
                }
            }.bind(this));

            this.shape.on('click', function (e) {
                this.wirePropsCmd.execute(this.srcInstance, this.targetInstance);
                e.cancelBubble = true;
            }.bind(this));

            return true;
        } else {
            return false;
        }
    },
    
    getSrcInstance: function () {
        return this.srcInstance;
    },

    getTargetInstance: function () {
        return this.targetInstance;
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
        this.srcInstance.ui.removeWire(this);
        this.targetInstance.ui.removeWire(this);
    },
    
    getShape: function () {
        return this.shape;
    },

    show: function () {
        this.shape.show();
    },

    hide: function () {
        this.shape.hide();
    }
});

module.exports = UIWire;