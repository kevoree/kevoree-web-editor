var Class = require('pseudoclass');

/**
 * Created by leiko on 27/01/14.
 */
var SaveModal = Class({
    toString: 'SaveModal',

    execute: function () {
        $('#modal-save').click();
    }
});

module.exports = SaveModal;
