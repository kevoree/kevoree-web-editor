var AbstractCommand = require('../AbstractCommand');

/**
 * Created by leiko on 24/01/14.
 */
var SetModel = AbstractCommand.extend({
    toString: 'SetModel',

    execute: function (model) {
        // set given model
        this.editor.setModel(model);
    }
});

module.exports = SetModel;