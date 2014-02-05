var Class               = require('pseudoclass'),
    ActionType          = require('kevoree-library').org.kevoree.modeling.api.util.ActionType,
    OpenInstanceProps   = require('../command/ui/OpenInstanceProps');

var CONTAINER  = 'container',
    TEXT       = 'text';

/**
 * Created by leiko on 27/01/14.
 */
var AbstractEntity = Class({
    toString: 'AbstractEntity',

    construct: function (instance, editor) {
        this.instance = instance;
        this.editor = editor;

        this.instance.addModelTreeListener({
            elementChanged : function (event) {
                if (event.getType() === ActionType.object.REMOVE) {
                    this.onRemove(event.getValue());

                } else if (event.getType() === ActionType.object.ADD) {
                    this.onAdd(event.getValue());

                } else if (event.getType() === ActionType.object.SET) {
                    this.onSet(event.getValue());

                } else {
                    console.log(instance.name+' unhandled event', event);
                }
            }.bind(this)
        });

        this.metadata = {x: 350, y: 100}; // default metadata
        if (instance.metaData && instance.metaData != null) {
            try {
                this.metadata = JSON.parse(instance.metaData);
            } catch (ignore) {}
        }

        this.shape = new Kinetic.Group({
            id: instance.path(),
            x: this.metadata.x,
            y: this.metadata.y,
            draggable: true
        });

        this.shape.drawBorder = true;

        var instPropsCmd = new OpenInstanceProps();
        this.shape.on('click', function (e) {
            console.log('clicked on '+instance.name);
            instPropsCmd.execute(instance);
            e.cancelBubble = true;
        });
    },

    update: function () {
        this.shape.id(this.instance.path());

        var textShape = this.shape.find('.'+TEXT)[0];
        if (textShape) {
            textShape.text(this.instance.name + '\n' + this.instance.typeDefinition.name);
            this.shape.getLayer().batchDraw();
        }
    },

    getShape: function () {
        return this.shape;
    },

    onRemove: function () {
        var layer = this.shape.getLayer();
        this.shape.remove();
        layer.batchDraw();
    },

    onSet: function (instance) {},
    onAdd: function (instance) {}
});

module.exports = AbstractEntity;
module.exports.CONTAINER = CONTAINER;
module.exports.TEXT = TEXT;
