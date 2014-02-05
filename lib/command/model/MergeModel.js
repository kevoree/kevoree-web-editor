var AbstractCommand = require('../AbstractCommand');

/**
 * Created by leiko on 24/01/14.
 */
var MergeModel = AbstractCommand.extend({
    toString: 'MergeModel',

    execute: function (model) {
        this.editor.mergeModel(model);
    }
});

module.exports = MergeModel;