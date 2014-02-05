var Class           = require('pseudoclass'),
    UIKevWebEditor  = require('../ui/UIKevWebEditor'),
    kevoree         = require('kevoree-library').org.kevoree,
    ModelEventProcessor = require('./ModelEventProcessor');

/**
 * Created by leiko on 23/01/14.
 */
var KevWebEditor = Class({
    toString: 'KevWebEditor',

    construct: function () {
        var factory = new kevoree.impl.DefaultKevoreeFactory();
        this.model = factory.createContainerRoot();
        var compare = new kevoree.compare.DefaultModelCompare();
        this.tracker = new kevoree.modeling.api.util.ModelTracker(compare);
        this.ui = new UIKevWebEditor(this);
        this.draggedElement = null;

        this.tracker.track(this.model);
        this.eventProcessor = new ModelEventProcessor(this.model, this.ui);
    },

    setModel: function (model) {
        this.ui.clean();
        this.tracker.untrack();

        this.model = model;
        this.tracker.track(this.model);
        this.eventProcessor.setModel(this.model);
        this.model.addModelTreeListener(this.eventProcessor.processor());
        this.ui.update();
    },

    setDraggedElement: function (elem) {
        this.draggedElement = elem;
    },

    getDraggedElement: function () {
        return this.draggedElement;
    },

    setDroppableContainerNode: function (node) {
        this.availableContainerNode = node;
    },

    getDroppableContainerNode: function () {
        return this.availableContainerNode;
    },

    undo: function () {
        this.tracker.undo();
    },

    redo: function () {
        this.tracker.redo();
    },

    mergeModel: function (model) {
        var compare = new kevoree.compare.DefaultModelCompare();
        compare.merge(this.model, model).applyOn(this.model);
        this.ui.update();
    },

    getModel: function () {
        return this.model;
    },

    getUI: function () {
        return this.ui;
    }
});

module.exports = KevWebEditor;