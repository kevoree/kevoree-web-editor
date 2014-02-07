var AbstractCommand = require('../AbstractCommand');

/**
 * Created by leiko on 27/01/14.
 */
var CloseModal = AbstractCommand.extend({
    toString: 'CloseModal',

    execute: function () {
        $('#modal-save').off('click');
        $('#modal').modal('hide');
    }
});

module.exports = CloseModal;
