var Class = require('pseudoclass');

/**
 * Created by leiko on 24/01/14.
 */
var MergeModel = Class({
    toString: 'MergeModel',

    execute: function (editor, model) {
        // TODO save model (or a diff) in another 'engine' for undo/redo
        editor.mergeModel(model);
    }
});

module.exports = MergeModel;