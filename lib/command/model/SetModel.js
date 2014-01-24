var Class = require('pseudoclass');

/**
 * Created by leiko on 24/01/14.
 */
var SetModel = Class({
    toString: 'SetModel',

    execute: function (editor, model) {
        // TODO save model (or a diff) in another 'engine' for undo/redo
        editor.setModel(model);
    }
});

module.exports = SetModel;