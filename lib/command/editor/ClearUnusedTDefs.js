var AbstractCommand = require('../AbstractCommand');

/**
 * Created by leiko on 03/04/14.
 */
var ClearUnusedTDefs = AbstractCommand.extend({
    toString: 'ClearUnusedTDefs',

    execute: function () {
        this.editor.clearUnusedTDefs();
    }
});

module.exports = ClearUnusedTDefs;