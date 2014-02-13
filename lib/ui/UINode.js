var HostedEntity    = require('./HostedEntity'),
    AbstractEntity  = require('./AbstractEntity'),
    UIComponent     = require('../ui/UIComponent'),
    AddComponent    = require('../command/model/AddComponent'),
    AddNode         = require('../command/model/AddNode'),
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
        this.hostedEntities = {};

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
            if (!this.hostedEntities[comp.path()]) {
                var uiComp = new UIComponent(comp, editor, instance);
                this.hostedEntities[comp.path()] = uiComp;
                this.shape.add(uiComp.getShape());
            } else {
                this.hostedEntities[comp.path()].update();
            }
        }

        var hostedNodes = instance.hosts.iterator();
        while (hostedNodes.hasNext()) {
            var node = hostedNodes.next();
            if (!this.hostedEntities[node.path()]) {
                var uiNode = new UINode(node, editor, instance);
                this.hostedEntities[node.path()] = uiNode;
                this.shape.add(uiNode.getShape());
            } else {
                this.hostedEntities[node.path()].update();
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

        var addCompCmd = new AddComponent(editor);
        var addNodeCmd = new AddNode(editor);
        this.shape.on('mouseup touchend', function (e) {
            console.log('mouseup '+instance.name);
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
                            addCompCmd.execute(draggedElem.instance.typeDefinition, draggedElem.instance.name, JSON.parse(draggedElem.instance.metaData), instance);
                        } else if (draggedElem.type === 'node') {
                            if (!instance.host) {
                                this.deleteCmd.execute(draggedElem.instance);
                            }
                            addNodeCmd.execute(draggedElem.instance.typeDefinition, draggedElem.instance.name, JSON.parse(draggedElem.instance.metaData), instance);
                        }
                    }
                }
            }
        }.bind(this));

        this.shape.on('dragstart', function (e) {
            e.cancelBubble = true;
            console.log('dragstart', instance.name);
            editor.setDraggedElement({type: 'node', instance: instance, shape: this.shape, typeDef: false});

            if (instance.host) {
                // this node instance is hosted within another node instance
                // do some drag'n'drop specific actions for hosted node instance
                var position = this.shape.getAbsolutePosition();
                var layer = this.shape.getLayer();
                instance.host.removeHosts(instance);
                layer.add(this.shape);
                this.shape.setPosition(position);
                this.shape.getLayer().batchDraw();
            } else {
                this.shape.setZIndex(0);
            }
        }.bind(this));

        this.shape.on('dragend', function (e) {
            console.log('dragend', instance.name);
            e.cancelBubble = true;

            if (instance.host) {
                var pointerPos = editor.getUI().getStage().getPointerPosition();
                var nodeShapes = this.shape.getLayer().find('.node-instance');
                var topLevelShape = null;
                for (var i=0; i < nodeShapes.length; i++) {
                    if (nodeShapes[i].getParent().id() !== instance.path()) {
                        if (nodeShapes[i].intersects(pointerPos)) {
                            if (!topLevelShape || (topLevelShape.getZIndex() < nodeShapes[i].getParent().getZIndex())) {
                                topLevelShape = nodeShapes[i].getParent();
                            }
                        }
                    }
                }

                if (topLevelShape) topLevelShape.fire('mouseup');
            }

            editor.setDraggedElement(null);
        }.bind(this));

        this.shape.on('dragmove', function () {
            var pointerPos = editor.getUI().getStage().getPointerPosition();
            var nodeShapes = this.shape.getLayer().find('.node-instance');
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
        while (components.hasNext()) hostedUIs.push(this.hostedEntities[components.next().path()]);
        while (hosts.hasNext())      hostedUIs.push(this.hostedEntities[hosts.next().path()]);

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

        // set new node group shape height
        this.bgRect.setHeight(compYOffset);
        this.border.setHeight(compYOffset);
    },

    onRemove: function (hostedInstancePath) {
        console.log('UINode', this.instance.name, 'onRemove', hostedInstancePath);
        var compUi = this.hostedEntities[hostedInstancePath].getShape();
        compUi.remove();
        delete this.hostedEntities[hostedInstancePath];
    },

    onAdd: function (instance) {
        if (!this.hostedEntities[instance.path()]) {
            console.log('UINode', this.instance.name, 'onAdd', instance.name);
            var type = ModelHelper.findInstanceType(instance);
            var uiEntity;
            switch (type) {
                case 'component':
                    uiEntity = new UIComponent(instance, this.editor, this.instance);
                    this.hostedEntities[instance.path()] = uiEntity;
                    break;

                case 'node':
                    uiEntity = new UINode(instance, this.editor, this.instance);
                    this.hostedEntities[instance.path()] = uiEntity;
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
        // Hosted entities subClass needs to redefine update because
        // the host shape act as a container for hosted shapes, so a call
        // to this.shape.find('.TEXT') would return every hosted text shape too
        this.shape.id(this.instance.path());

        var textShape = this.shape.find('#'+AbstractEntity.TEXT+'_'+this.instance.path())[0];
        if (textShape) {
            textShape.text(this.instance.name + ' : ' + this.instance.typeDefinition.name);
            this.shape.getLayer().batchDraw();
        }
    }
});

module.exports = UINode;
