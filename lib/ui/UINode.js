var HostedEntity    = require('./HostedEntity'),
    AbstractEntity  = require('./AbstractEntity'),
    UIComponent     = require('../ui/UIComponent'),
    AddComponent    = require('../command/model/AddComponent'),
    DeleteNode      = require('../command/model/DeleteNode'),
    ModelHelper     = require('../util/ModelHelper');

// CONSTANTS
var PADDING = 12;

/**
 * Created by leiko on 27/01/14.
 */
var UINode = HostedEntity.extend({
    toString: 'UINode',

    construct: function (instance, editor, hostInstance) {
        this.hostedEntities = {};

        this.text = new Kinetic.Text({
            text:       instance.name + ' : ' + instance.typeDefinition.name,
            fontSize:   14,
            fontFamily: 'Helvetica',
            fill:       '#FFF',
            padding:    PADDING,
            align:      'center'
        });

        this.bgRect = new Kinetic.Rect({
            width:   this.text.getWidth(),
            height:  this.text.getHeight(),
            fill:    'white',
            cornerRadius:  10,
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
            shadowBlur:    10,
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

        this.shape.on('mouseover touchmove', function (e) {
            var draggedEntity = editor.getDraggedElement();
            if (draggedEntity) {
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

        this.shape.on('mouseout touchend', function () {
            this.border.setStroke('#FFF');
            this.shape.getLayer().batchDraw();
        }.bind(this));

        var addCompCmd = new AddComponent(editor);
        this.shape.on('mouseup touchend', function (e) {
            var draggedElem = editor.getDraggedElement();
            if (draggedElem) {
                if (draggedElem.type === 'component' || draggedElem.type === 'node') {
                    if (draggedElem.typeDef) {
                        // this code is triggered by a drag'n'drop from TypeDefList of a Node or Component
                        // if editor.getDroppableContainerNode() is already set, it means that another node
                        // already answered positively to that event, so this one do not have to process it
                        if (!editor.getDroppableContainerNode()) {
                            editor.setDroppableContainerNode(instance);
                            console.log('mouseup', instance.name, e);
                        }

                    } else {
                        draggedElem.shape.remove();
                        addCompCmd.execute(draggedElem.instance.typeDefinition, draggedElem.instance.name, draggedElem.instance.metaData, instance);
                    }
                }
            }
        }.bind(this));

        this.shape.on('dragstart', function () {
            this.shape.setZIndex(0);
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

    onRemove: function (compInstance) {
        delete this.hostedEntities[compInstance.path()];
    },

    onAdd: function (instance) {
        var type = ModelHelper.findInstanceType(instance);
        var uiEntity;
        switch (type) {
            case 'component':
                uiEntity = new UIComponent(instance, this.editor, this.instance);
                this.hostedEntities[instance.path()] = uiEntity;
                break;

            case 'node':
                uiEntity = new UINode(instance, this.editor);
                this.hostedEntities[instance.path()] = uiEntity;
                break;
        }

        this.shape.add(uiEntity.getShape());
        this.editor.getUI().update();
    },

    onDelete: function () {
        this.deleteCmd.execute(this.instance, this.hostInstance);
    },

    getPlugPosition: function () {
        var shapePos = this.shape.getAbsolutePosition();
        return {
            x: shapePos.x + PADDING/2,
            y: shapePos.y + PADDING/2
        };
    }
});

module.exports = UINode;
