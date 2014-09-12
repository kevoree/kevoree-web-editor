var Class               = require('pseudoclass'),
    UIKevWebEditor      = require('../ui/UIKevWebEditor'),
    kevoree             = require('kevoree-library').org.kevoree,
    Kotlin              = require('kevoree-kotlin'),
    ModelEventProcessor = require('./ModelEventProcessor'),
    KevsParser          = require('./kevscript/KevsParser'),
    KevsHint            = require('./kevscript/KevsHint');

/**
 * Created by leiko on 23/01/14.
 */
var KevWebEditor = Class({
    toString: 'KevWebEditor',

    construct: function () {
        var factory = new kevoree.factory.DefaultKevoreeFactory();
        this.model = factory.createContainerRoot();
        this.compare = factory.createModelCompare();
        this.tracker = new kevoree.modeling.api.util.ModelTracker(this.compare);
        this.ui = new UIKevWebEditor(this);
        this.draggedElement = null;

        this.tracker.track(this.model);
        this.eventProcessor = new ModelEventProcessor(this, this.ui);
        this.eventProcessorElemVisitor = new kevoree.modeling.api.util.ModelVisitor();
        this.eventProcessorElemVisitor.visit = function (elem) {
            // if elem has an ui in the editor, ask its eventProcessor to do postProcess
            // in order to apply the changes made by the merge
//            console.log('visit', elem.name);
            if (elem.ui) {
                console.log('VISIT FOR POST PROCESS', elem.name);
                elem.ui.eventProcessor.doPostProcess();
            }
        };
        this.processor = this.eventProcessor.processor();

        this.fragDicsVisitor = new kevoree.modeling.api.util.ModelVisitor();
        this.fragDicsVisitor.visit = function (elem, ref) {
            if (Kotlin.isType(elem, kevoree.FragmentDictionary)) {
                var node = this.model.findNodesByID(elem.name);
                if (node) {
                    node.addModelElementListener({
                        elementChanged: function (event) {
                            if (event.etype === kevoree.modeling.api.util.ActionType.object.SET && event.elementAttributeName === 'name') {
                                elem.name = event.value;
                            }
                        }
                    });
                }
            }
        }.bind(this);

        new KevsParser(this);
        new KevsHint(this);
    },

    setModel: function (model) {
        this.ui.cancelUIUpdates();
        this.ui.clean();
        this.tracker.untrack();

        this.model = model;
        this.model.visit(this.fragDicsVisitor, true, true, true);
        this.tracker.track(this.model);
        this.eventProcessor.setModel(this.model);
        this.model.addModelElementListener(this.processor);
        this.ui.enableUIUpdates();
        this.ui.update();
        this.ui.hideLoadingLayer();
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
        var factory = new kevoree.factory.DefaultKevoreeFactory();
        this.setModel(factory.createContainerRoot());
    },
    
    clearInstances: function () {
        this.model.removeAllNodes();
        this.model.removeAllGroups();
        this.model.removeAllHubs();
        this.model.removeAllMBindings();
        this.ui.clean();
    },

    clearUnusedTDefs: function () {
        this.ui.cancelUIUpdates();
        this.ui.showLoadingLayer();
        var usedTdefs = [];

        function addUsedTDef(elements) {
            while (elements.hasNext()) {
                var elem = elements.next();
                if (elem.components && elem.components.size() > 0) {
                    // elem is a node: check components typeDefinition
                    addUsedTDef(elem.components.iterator());
                }

                if (elem.subNodes && elem.subNodes.size() > 0) {
                    // elem is a node: check subNodes typeDefinition
                    addUsedTDef(elem.subNodes.iterator());

                }

                if (usedTdefs.indexOf(elem.typeDefinition) === -1) {
                    usedTdefs.push(elem.typeDefinition);
                }
            }
        }
        addUsedTDef(this.model.nodes.iterator());
        addUsedTDef(this.model.groups.iterator());
        addUsedTDef(this.model.hubs.iterator());

        var tDefsToDelete = [], tdefs, tdef;
        tdefs = this.model.typeDefinitions.iterator();
        while (tdefs.hasNext()) {
            tdef = tdefs.next();
            if (usedTdefs.indexOf(tdef) === -1) {
                tDefsToDelete.push(tdef);
            }
        }

        for (var i=0; i < tDefsToDelete.length; i++) {
            // remove TypeDefinition
            this.model.removeTypeDefinitions(tDefsToDelete[i]);
            // remove Library
            var libraries = this.model.libraries.iterator();
            while (libraries.hasNext()) {
                var lib = libraries.next();
                lib.removeSubTypes(tDefsToDelete[i]);
                if (lib.subTypes.size() === 0) {
                    this.model.removeLibraries(lib);
                }
            }
            // remove DeployUnit
            var removeDU = true;
            tdefs = this.model.typeDefinitions.iterator();
            while (tdefs.hasNext()) {
                tdef = tdefs.next();
                if (tdef.deployUnit.name === tDefsToDelete[i].deployUnit.name) {
                    removeDU = false;
                }
            }
            if (removeDU) {
                this.model.removeDeployUnits(tDefsToDelete[i].deployUnit);
            }
        }

        this.ui.enableUIUpdates();
        this.ui.update();
        this.ui.hideLoadingLayer();
    },

    undo: function () {
        this.tracker.undo();
    },

    redo: function () {
        this.tracker.redo();
    },

    mergeModel: function (model) {
        this.ui.cancelUIUpdates();
        this.delayEventProcessor = true;
        this.compare.merge(this.model, model).applyOn(this.model);
        this.delayEventProcessor = false;
        
        // call postProcess on ModelEventProcessor when merge is done
        this.eventProcessor.doPostProcess();

        // call postProcess on each EntityEventProcessor too
        this.model.visit(this.eventProcessorElemVisitor, true, true, false);

        // visit model to register a listener on each fragmentDictionary (to update name accordingly on changes)
        this.model.visit(this.fragDicsVisitor, true, true, false);
        
        // re-attach model listener
        this.suspendModelListener();
        this.enableModelListener();
        
        // update ui
        this.ui.enableUIUpdates();
        this.ui.update();
        this.ui.hideLoadingLayer();
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