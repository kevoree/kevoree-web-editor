var AbstractCommand = require('../AbstractCommand'),
    CloseModalCmd   = require('../ui/CloseModal'),
    pkg             = require('../../../package.json');

/**
 * Created by leiko on 27/01/14.
 */
var OpenHelpModal = AbstractCommand.extend({
    toString: 'OpenHelpModal',
    
    construct: function (editor) {
        this.closeModal = new CloseModalCmd(editor);
    },
    
    execute: function (e) {
        e.preventDefault();
        $('#modal-content').html(templates['help-modal'].render({
            version: pkg.version
        }));

        $('#modal').modal();
    }
});

module.exports = OpenHelpModal;
