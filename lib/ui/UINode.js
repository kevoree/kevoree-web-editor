var HostedEntity    = require('./HostedEntity'),
    AbstractEntity  = require('./AbstractEntity'),
    UIComponent     = require('../ui/UIComponent'),
    DeleteNode      = require('../command/model/DeleteNode'),
    ModelHelper     = require('../util/ModelHelper');

// CONSTANTS
var PADDING = 12;

/**
 * Created by leiko on 27/01/14.
 */
var UINode = HostedEntity.extend({
    toString: 'UINode',

    construct: function (instance, editor) {
        this.text = new Kinetic.Text({
            id:         AbstractEntity.TEXT+'_'+instance.path(),
            text:       instance.name + ' : ' + instance.typeDefinition.name,
            fontSize:   14,
            fontFamily: 'Helvetica',
            fill:       '#FFF',
            padding:    PADDING,
            align:      'center'
        });

        this.bgRect = new Kinetic.Rect({
            name:    'node-instance',
            width:   this.text.getWidth(),
            height:  this.text.getHeight(),
            fill:    'white',
            cornerRadius:  5,
            opacity: 0.1
        });

        this.bgRect.sceneFunc(function (context) {
            this.refreshShapeAttributes();
            this.bgRect._sceneFunc(context);
        }.bind(this));

        this.border = new Kinetic.Rect({
            width:         this.bgRect.getWidth(),
            height:        this.bgRect.getHeight(),
            stroke:        'white',
            strokeWidth:   2,
            cornerRadius:  10,
            shadowColor:   'black',
            shadowBlur:    5,
            shadowOffset:  [5, 5],
            shadowOpacity: 0.6
        });

        this.shape.add(this.bgRect);
        this.shape.add(this.border);
        this.shape.add(this.text);

        var components = instance.components.iterator();
        while (components.hasNext()) {
            var comp = components.next();
            if (!comp.ui) {
                var uiComp = new UIComponent(comp, editor, instance);
                this.shape.add(uiComp.getShape());
            } else {
                comp.ui.update();
            }
        }

        var hostedNodes = instance.hosts.iterator();
        while (hostedNodes.hasNext()) {
            var node = hostedNodes.next();
            if (!node.ui) {
                var uiNode = new UINode(node, editor, instance);
                this.shape.add(uiNode.getShape());
            } else {
                node.ui.update();
            }
        }

        this.shape.on('mouseover touchmove', function (e) {
            var draggedEntity = editor.getDraggedElement();
            if (draggedEntity && this.shape.getLayer()) {
                if (draggedEntity.type === 'component' || draggedEntity.type === 'node') {
                    this.border.setStroke('#0F0');
                    this.shape.getLayer().batchDraw();
                } else {
                    this.border.setStroke('#F00');
                    this.shape.getLayer().batchDraw();
                }
            }
            e.cancelBubble = true;
        }.bind(this));

        this.shape.on('mouseout mousenotover touchend', function () {
            if (this.shape.getLayer()) {
                this.border.setStroke('#FFF');
                this.shape.getLayer().batchDraw();
            }
        }.bind(this));

        this.shape.on('mouseup touchend', function (e) {
            if (this.shape.getLayer()) {
                this.border.setStroke('#FFF');
                this.shape.getLayer().batchDraw();
            }

            var draggedElem = editor.getDraggedElement();
            if (draggedElem) {
                if (draggedElem.typeDef && (draggedElem.type === 'component' || draggedElem.type === 'node')) {
                    // this code is triggered by a drag'n'drop from TypeDefList of a Node or Component
                    // if editor.getDroppableContainerNode() is already set, it means that another node
                    // already answered positively to that event, so this one do not have to process it
                    if (!editor.getDroppableContainerNode()) {
                        // but if editor.getDroppableContainerNode() == null, then this node will be the container
                        editor.setDroppableContainerNode(instance);
                    }
                } else {
                    if (draggedElem.instance.path() !== instance.path()) {
                        draggedElem.shape.remove();
                        if (draggedElem.type === 'component') {
                            instance.addComponents(draggedElem.instance);

                        } else if (draggedElem.type === 'node') {
                            instance.addHosts(draggedElem.instance);
                            e.cancelBubble = true;
                            editor.setDraggedElement(null);
                        }
                    }
                }
            }
        }.bind(this));

        this.shape.on('dragstart', function (e) {
            e.cancelBubble = true;
            editor.setDraggedElement({type: 'node', instance: instance, shape: this.shape, typeDef: false});
            
            if (instance.host) {
                // starting to drag an hosted node
                var position = this.shape.getAbsolutePosition();
                var layer = this.shape.getLayer();
                instance.host.removeHosts(instance);
                layer.add(this.shape);
                this.shape.setPosition(position);
            }

            this.shape.setZIndex(0);
        }.bind(this));

        this.shape.on('dragend', function (e) {
            // if we end-up here, it means that this node has no host (otherwise, its host would have consume the event)
            // so we need to put this shape back in the editor ui instances map
            e.cancelBubble = true;
            editor.setDraggedElement(null);
        }.bind(this));

        this.shape.on('dragmove', function () {
            var pointerPos = editor.getUI().getStage().getPointerPosition();
            var nodeShapes = editor.getUI().getStage().find('.node-instance');
            var topLevelShape = null;
            for (var i=0; i < nodeShapes.length; i++) {
                if (nodeShapes[i].getParent().id() !== instance.path()) {
                    if (nodeShapes[i].intersects(pointerPos)) {
                        if (!topLevelShape || (topLevelShape.getZIndex() < nodeShapes[i].getParent().getZIndex())) {
                            if (topLevelShape) topLevelShape.fire('mousenotover');
                            topLevelShape = nodeShapes[i].getParent();
                        }
                    } else {
                        nodeShapes[i].getParent().fire('mousenotover');
                    }
                }
            }
            if (topLevelShape) topLevelShape.fire('mouseover');
        }.bind(this));

        console.log('UINode', this.shape);

        this.deleteCmd = new DeleteNode(editor);
    },

    /**
     * This method is called each time KineticJS judge necessary to redraw the shape
     */
    refreshShapeAttributes: function () {
        var components = this.instance.components.iterator(),
            hosts = this.instance.hosts.iterator(),
            compYOffset = this.text.getHeight(),
            rectMiddle = this.bgRect.getWidth() / 2;

        var hostedUIs = [];
        while (components.hasNext()) hostedUIs.push(components.next().ui);
        while (hosts.hasNext())      hostedUIs.push(hosts.next().ui);

        for (var i=0; i < hostedUIs.length; i++) {
            if (hostedUIs[i]) {
                // check if hosted entity group shape width is wider than its host's width or not
                if (hostedUIs[i].getWidth() >= this.bgRect.getWidth()) {
                    // hosted entity is wider => increase host width to fit hosted entity
                    this.setWidth(hostedUIs[i].getWidth() + PADDING*2);
                    // increase all other hosted entities
                    var current_i = i;
                    for (var j=current_i-1; j == 0; j--) {
                        hostedUIs[j].setWidth(this.bgRect.getWidth() - PADDING*2);
                    }

                } else {
                    // compute hosted entity group shape width to fit node group shape
                    hostedUIs[i].setWidth(this.bgRect.getWidth() - PADDING*2);
                    // end compute width
                }

                // compute hosted entity group shape x and y position in node group shape
                hostedUIs[i].setX(rectMiddle - (hostedUIs[i].getWidth() / 2));
                hostedUIs[i].setY(compYOffset);
                compYOffset += hostedUIs[i].getHeight() + PADDING;
                // end compute position
            }
        }

        // set new node group shape height & width
        this.bgRect.setHeight(compYOffset);
        this.border.setHeight(compYOffset);
        this.bgRect.setWidth(this.text.getWidth());
        this.border.setWidth(this.text.getWidth());
    },

    onRemove: function (hostedInstancePath) {
        console.log('UINode', this.instance.name, 'onRemove', hostedInstancePath);
        // TODO
    },
    
    onRemoveHostedInstance: function (instance) {
        console.log('SHAPE REMOVED');
        instance.ui.getShape().remove();
    },

    onAdd: function (instance) {
        console.log('Wanna add', instance.name, 'in', this.instance.name, 'using ui', instance.ui);
        if (instance) {
            var type = ModelHelper.findInstanceType(instance);
            var uiEntity = instance.ui;
            switch (type) {
                case 'component':
                    if (!uiEntity) uiEntity = new UIComponent(instance, this.editor);
                    break;

                case 'node':
                    if (!uiEntity) uiEntity = new UINode(instance, this.editor);
                    break;
            }
            this.shape.add(uiEntity.getShape());
            this.editor.getUI().update();
        }
    },

    onDelete: function () {
        this.deleteCmd.execute(this.instance);
    },

    getPlugPosition: function () {
        var shapePos = this.shape.getAbsolutePosition();
        return {
            x: shapePos.x + PADDING/2,
            y: shapePos.y + PADDING/2
        };
    },

    update: function () {
        if (this.shape.getLayer()) {
            this.shape.id(this.instance.path());
            if (this.instance.name.length > 15) {
                this.text.text(this.instance.name + '\n' + this.instance.typeDefinition.name);
            } else {
                this.text.text(this.instance.name + ' : ' + this.instance.typeDefinition.name);
            }
            this.shape.getLayer().batchDraw();
        }
    },

    onSet: function (sourcePath, attrName, value) {
//        switch (attrName) {
//            case 'name':
//                if (this.instance.host) {
//                    var ui = this.instance.host.ui.hostedEntities[sourcePath];
//                    delete this.instance.host.ui.hostedEntities[sourcePath];
//                    this.instance.host.ui.hostedEntities[this.instance.path()] = ui;
//                    
//                    for (var path in this.hostedEntities) {
//                        var ui = this.hostedEntities[path];
//                        var newPath = path.replace(sourcePath, this.instance.path());
//                        delete this.hostedEntities[path];
//                        this.hostedEntities[newPath] = ui;
//                    }
//                }
//                break;
//        }
        
        console.log('SET UINode', this.instance.name, sourcePath, attrName, value);
        this.update();
    }
});

module.exports = UINode;
