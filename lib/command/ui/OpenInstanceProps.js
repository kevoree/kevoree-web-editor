var AbstractCommand = require('../AbstractCommand'),
    CloseModal      = require('./CloseModal');

/**
 * Created by leiko on 27/01/14.
 */
var OpenInstanceProps = AbstractCommand.extend({
    toString: 'OpenInstanceProps',

    construct: function (editor, instanceUI) {
        this.instanceUI = instanceUI;
        this.closeModalCmd = new CloseModal(editor);
    },

    execute: function (instance, otherInstance) {
        $('#modal-content').html(EditorTemplates['instance-properties'].render({
            title: 'Instance properties: '+(otherInstance ? instance.name + ' <-> '+otherInstance.name : instance.name),
            name: instance.name
        }));

        $('#modal-save').off('click');
        $('#modal-save').on('click', function () {
            var name = $('#instance-name').val();
            instance.name = name;
            this.closeModalCmd.execute();
        }.bind(this));
        
        $('#delete-instance').off('click');
        $('#delete-instance').on('click', function () {
            this.instanceUI.onDelete();
            this.editor.getUI().update();
        }.bind(this));

        $('#modal').modal();
    }
});

module.exports = OpenInstanceProps;
