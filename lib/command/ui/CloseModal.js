var Class = require('pseudoclass');

/**
 * Created by leiko on 27/01/14.
 */
var CloseModal = Class({
    toString: 'CloseModal',

    execute: function () {
        $('#modal-save').off('click');
        $('#modal').modal('hide');
    }
});

module.exports = CloseModal;
