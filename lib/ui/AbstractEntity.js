var Class = require('pseudoclass');
var ActionType = require('kevoree-library').org.kevoree.modeling.api.util.ActionType;

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
        if (instance.metaData) {
            try {
                this.metadata = JSON.parse(instance.metaData);
            } catch (ignore) {}
        }

        this.shape = new Kinetic.Group({
            name: instance.path(),
            x: this.metadata.x,
            y: this.metadata.y,
            draggable: true
        });

        this.shape.drawBorder = true;

        this.shape.on('click', function (e) {
            console.log('clicked on '+instance.name);
            e.cancelBubble = true;
        });
    },

    getShape: function () {
        return this.shape;
    },

    onRemove: function (instance) {},
    onSet: function (instance) {},
    onAdd: function (instance) {}
});

module.exports = AbstractEntity;
module.exports.CONTAINER = CONTAINER;
module.exports.TEXT = TEXT;
