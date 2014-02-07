var AbstractCommand = require('../AbstractCommand');

/**
 * Created by leiko on 27/01/14.
 */
var OpenInstanceProps = AbstractCommand.extend({
    toString: 'OpenInstanceProps',

    construct: function (editor, instanceUI) {
        this.instanceUI = instanceUI;
        this.modalSaveBtn = $('#modal-save');
    },

    execute: function (instance, otherInstance) {
        $('#modal-content').html(EditorTemplates['instance-properties'].render({
            title: 'Instance properties: '+(otherInstance ? instance.name + ' <-> '+otherInstance.name : instance.name),
            name: instance.name
        }));

        this.modalSaveBtn.off('click');
        this.modalSaveBtn.on('click', function () {
            console.log("openinstanceprops clicked");
        });
        
        $('#delete-instance').off('click');
        $('#delete-instance').on('click', function () {
            this.instanceUI.onDelete();
            this.editor.getUI().update();
        }.bind(this));

        $('#modal').modal();
    }
});

module.exports = OpenInstanceProps;
