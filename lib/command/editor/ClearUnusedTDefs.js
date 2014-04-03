var AbstractCommand = require('../AbstractCommand');

/**
 * Created by leiko on 03/04/14.
 */
var ClearUnusedTDefs = AbstractCommand.extend({
    toString: 'ClearUnusedTDefs',

    execute: function () {
        this.editor.getUI().cancelUIUpdates();
        this.editor.getUI().showLoadingLayer();
        var model = this.editor.getModel();
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
        addUsedTDef(model.nodes.iterator());
        addUsedTDef(model.groups.iterator());
        addUsedTDef(model.hubs.iterator());

        var tDefsToDelete = [];
        var tdefs = model.typeDefinitions.iterator();
        while (tdefs.hasNext()) {
            var tdef = tdefs.next();
            if (usedTdefs.indexOf(tdef) === -1) {
                tDefsToDelete.push(tdef);
            }
        }

        for (var i in tDefsToDelete) {
            model.removeTypeDefinitions(tDefsToDelete[i]);
            var libraries = model.libraries.iterator();
            while (libraries.hasNext()) {
                var lib = libraries.next();
                lib.removeSubTypes(tDefsToDelete[i])
                if (lib.subTypes.size() === 0) {
                    model.removeLibraries(lib);
                }
            }
        }

        this.editor.getUI().enableUIUpdates();
        this.editor.getUI().update();
        this.editor.getUI().hideLoadingLayer();
    }
});

module.exports = ClearUnusedTDefs;