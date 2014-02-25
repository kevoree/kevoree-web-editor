var AbstractCommand = require('./AbstractCommand'),
    Alert = require('../util/Alert');

var Undo = AbstractCommand.extend({
    toString: 'Undo',

    execute: function () {
        var alert = new Alert();
        alert.setType('warning');
        alert.setText('Undo', 'Not implemented yet');
        alert.show(2000);
//        this.editor.undo();
    }
});

module.exports = Undo;