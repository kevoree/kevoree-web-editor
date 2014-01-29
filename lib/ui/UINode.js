var AbstractEntity = require('./AbstractEntity');
var UIComponent = require('../ui/UIComponent');
var AddComponent = require('../command/model/AddComponent');
var AddInstance = require('../command/model/AddInstance');
var ModelHelper = require('../util/ModelHelper');

// CONSTANTS
var PADDING = 12;

/**
 * Created by leiko on 27/01/14.
 */
var UINode = AbstractEntity.extend({
    toString: 'UINode',

    construct: function (instance, editor) {
        this.compUIInstances = {};

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
            if (!this.compUIInstances[comp.path()]) {
                var uiComp = new UIComponent(comp, instance, editor);
                this.compUIInstances[comp.path()] = uiComp;
                this.shape.add(uiComp.getShape());
            } else {
                this.compUIInstances[comp.path()].update();
            }
        }

        this.shape.on('mouseover touchmove', function () {
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
        }.bind(this));

        this.shape.on('mouseout touchend', function () {
            this.border.setStroke('#FFF');
            this.shape.getLayer().batchDraw();
        }.bind(this));

        var addCompCmd = new AddComponent();
        var addInstCmd = new AddInstance();
        this.shape.on('mouseup touchend', function (e) {
            var draggedElem = editor.getDraggedElement();
            if (draggedElem) {
                if (draggedElem.type === 'component' || draggedElem.type === 'node') {
                    if (draggedElem.typeDef) {
                        console.log("mouseup");
                        //addInstCmd.execute(null, draggedElem.type, ModelHelper.findLatestVersion(draggedElem.type, editor.getModel()), editor);

                    } else {
                        draggedElem.shape.remove();
                        addCompCmd.execute(instance, draggedElem.instance);
                    }
                }
            }
        }.bind(this));

        this.shape.on('dragstart', function () {
            this.shape.setZIndex(0);
        }.bind(this));

        console.log('UINode', this.shape);
    },

    /**
     * This method is called each time KineticJS judge necessary to redraw the shape
     */
    refreshShapeAttributes: function () {
        var components = this.instance.components.iterator(),
            compYOffset = this.text.getHeight(),
            rectMiddle = this.bgRect.getWidth() / 2;

        while (components.hasNext()) {
            var uiComp = this.compUIInstances[components.next().path()];

            // compute component group shape width to fit node group shape
            uiComp.setWidth(this.bgRect.getWidth() - PADDING*2);
            // end compute width

            // compute component group shape x and y position in node group shape
            uiComp.setX(rectMiddle - (uiComp.getWidth() / 2));
            uiComp.setY(compYOffset);
            compYOffset += uiComp.getHeight() + PADDING;
            // end compute position
        }

        // set new node group shape height
        this.bgRect.setHeight(compYOffset);
        this.border.setHeight(compYOffset);
    },

    onRemove: function (compInstance) {
        delete this.compUIInstances[compInstance.path()];
    },

    onAdd: function (compInstance) {
        var uiComp = new UIComponent(compInstance, this.instance, editor);
        this.compUIInstances[compInstance.path()] = uiComp;
        this.shape.add(uiComp.getShape());
        this.shape.getLayer().batchDraw();
    },

    update: function () {
        var textShape = this.shape.find('.'+AbstractEntity.TEXT)[0];
        textShape.text(this.instance.name + '\n' + this.instance.typeDefinition.name);
        this.shape.getLayer().batchDraw();
    }
});

module.exports = UINode;
