var AbstractCommand = require('../AbstractCommand'),
    Alert = require('../../util/Alert');

var Redo = AbstractCommand.extend({
    toString: 'Redo',

    execute: function () {
        var alert = new Alert();
        alert.setType('warning');
        alert.setText('Redo', 'Not implemented yet');
        alert.show(2000);
//        this.editor.redo();
    }
});

module.exports = Redo;