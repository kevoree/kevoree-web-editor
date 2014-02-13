var AbstractCommand = require('../AbstractCommand');

/**
 * Created by leiko on 27/01/14.
 */
var SaveModal = AbstractCommand.extend({
    toString: 'SaveModal',

    execute: function () {
        // this will trigger 'click' listener (registered in OpenInstanceProps for instance)
        $('#modal-save').click();
    }
});

module.exports = SaveModal;
