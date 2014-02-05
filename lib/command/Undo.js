var AbstractCommand = require('./AbstractCommand');

var Undo = AbstractCommand.extend({
    toString: 'Undo',

    execute: function () {
        this.editor.undo();
    }
});

module.exports = Undo;