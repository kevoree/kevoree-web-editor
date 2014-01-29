var Class = require('pseudoclass');
var UIKevWebEditor = require('../ui/UIKevWebEditor');
var kevoree = require('kevoree-library').org.kevoree;

var ActionType = kevoree.modeling.api.util.ActionType;

/**
 * Created by leiko on 23/01/14.
 */
var KevWebEditor = Class({
    toString: 'KevWebEditor',

    construct: function () {
        var factory = new kevoree.impl.DefaultKevoreeFactory();
        this.model = factory.createContainerRoot();
        this.ui = new UIKevWebEditor(this);
        this.draggedElement = null;
    },

    addGroup: function (instance) {
        this.model.addGroups(instance);
        this.ui.addGroup(instance);
    },

    addNode: function (instance) {
        this.model.addNodes(instance);
        this.ui.addNode(instance);
    },

    addChannel: function (instance) {
        this.model.addHubs(instance);
        this.ui.addChannel(instance);
    },

    setModel: function (model) {
        this.model = model;
        this.model.addModelTreeListener({
            elementChanged : function (event) {
                if (event.getType() === ActionType.object.REMOVE) {
                    console.log('remove', event);

                } else if (event.getType() === ActionType.object.ADD) {
                    console.log('add', event);

                } else if (event.getType() === ActionType.object.SET) {
                    console.log('set', event);

                } else {
                    console.log('Editor unhandled event', event);
                }
            }.bind(this)
        });
        this.ui.update();
    },

    setDraggedElement: function (elem) {
        this.draggedElement = elem;
    },

    getDraggedElement: function () {
        return this.draggedElement;
    },

    mergeModel: function (model) {
        var compare = new kevoree.compare.DefaultModelCompare();
        compare.merge(this.model, model).applyOn(this.model);
        this.ui.update();
    },

    getModel: function () {
        return this.model;
    }
});

module.exports = KevWebEditor;