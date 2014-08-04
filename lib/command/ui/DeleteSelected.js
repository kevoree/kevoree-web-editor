var AbstractCommand = require('../AbstractCommand');
var kevoree = require('kevoree-library').org.kevoree;

/**
 * Created with IntelliJ IDEA.
 * User: leiko
 * Date: 01/08/14
 * Time: 18:00
 */
var DeleteSelected = AbstractCommand.extend({
    toString: 'DeleteSelected',

    construct: function () {
        this.visitor = new kevoree.modeling.api.util.ModelVisitor();

        this.visitor.visit = function (elem) {
            // if elem has an ui in the editor, ask its eventProcessor to do postProcess
            // in order to apply the changes made by the merge
            if (elem.ui && elem.ui.isSelected) {
                elem.ui.onDelete();
            }
        };
    },

    execute: function () {
        this.editor.getModel().visit(this.visitor, true, true, false);
        this.editor.getUI().update();
    }
});

module.exports = DeleteSelected;