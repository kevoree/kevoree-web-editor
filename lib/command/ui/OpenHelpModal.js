var AbstractCommand = require('../AbstractCommand'),
    CloseModalCmd   = require('../ui/CloseModal');

/**
 * Created by leiko on 27/01/14.
 */
var OpenHelpModal = AbstractCommand.extend({
    toString: 'OpenHelpModal',
    
    construct: function (editor) {
        this.closeModal = new CloseModalCmd(editor);
    },
    
    execute: function (e) {
        $('#modal-content').html(EditorTemplates['help-modal'].render());

        $('#modal').modal();
    }
});

module.exports = OpenHelpModal;
