var AbstractCommand = require('./AbstractCommand');

var Redo = AbstractCommand.extend({
    toString: 'Redo',

    execute: function () {
        this.editor.redo();
    }
});

module.exports = Redo;