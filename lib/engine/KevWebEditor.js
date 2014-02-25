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
        this.compare = new kevoree.compare.DefaultModelCompare();
        this.tracker = new kevoree.modeling.api.util.ModelTracker(this.compare);
        this.ui = new UIKevWebEditor(this);
        this.draggedElement = null;

        this.tracker.track(this.model);
        this.eventProcessor = new ModelEventProcessor(this, this.ui);
        this.eventProcessorElemVisitor = new kevoree.modeling.api.util.ModelVisitor();
        this.eventProcessorElemVisitor.visit = function (elem) {
            // if elem has an ui in the editor, ask its eventProcessor to do postProcess
            // in order to apply the changes made by the merge
            if (elem.ui) elem.ui.eventProcessor.doPostProcess();
        };
        this.processor = this.eventProcessor.processor();
    },

    setModel: function (model) {
        this.ui.clean();
        this.tracker.untrack();

        this.model = model;
        this.tracker.track(this.model);
        this.eventProcessor.setModel(this.model);
        this.model.addModelElementListener(this.processor);
        this.ui.update();
    },
    
    suspendModelListener: function () {
        this.model.removeModelElementListener(this.processor);
    },
    
    enableModelListener: function () {
        this.model.addModelElementListener(this.processor);
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
    
    clearAll: function () {
        var factory = new kevoree.impl.DefaultKevoreeFactory();
        this.setModel(factory.createContainerRoot());
    },
    
    clearInstances: function () {
        this.model.removeAllNodes();
        this.model.removeAllGroups();
        this.model.removeAllHubs();
        this.model.removeAllNodeNetworks();
        this.model.removeAllMBindings();
        this.ui.clean();
    },

    undo: function () {
        this.tracker.undo();
    },

    redo: function () {
        this.tracker.redo();
    },

    mergeModel: function (model) {
        this.delayEventProcessor = true;
        this.compare.merge(this.model, model).applyOn(this.model);
        this.delayEventProcessor = false;
        
        // call postProcess on ModelEventProcessor when merge is done
        this.eventProcessor.doPostProcess();
        
        // call postProcess on each EntityEventProcessor too
        this.model.visit(this.eventProcessorElemVisitor, true, true, true);
        
        // re-attach model listener
        this.suspendModelListener();
        this.enableModelListener();
        
        // update ui
        this.ui.update();
    },

    getModel: function () {
        return this.model;
    },

    getUI: function () {
        return this.ui;
    },
    
    delayingEventProcessor: function () {
        return this.delayEventProcessor;
    }
});

module.exports = KevWebEditor;