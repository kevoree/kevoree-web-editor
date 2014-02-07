var Class = require('pseudoclass');

/**
 * Created by leiko on 27/01/14.
 */
var OpenInstanceProps = Class({
    toString: 'OpenInstanceProps',

    construct: function (instanceUI) {
        this.instanceUI = instanceUI;
        this.modalSaveBtn = $('#modal-save');
    },

    execute: function (instance, otherInstance) {
        $('#modal-content').html(EditorTemplates['instance-properties'].render({
            title: 'Instance properties: '+(otherInstance ? instance.name + ' <-> '+otherInstance.name : instance.name)

        }));

        this.modalSaveBtn.off('click');
        this.modalSaveBtn.on('click', function () {
            console.log("openinstanceprops clicked");
        });
        
        $('#delete-instance').off('click');
        $('#delete-instance').on('click', function () {
            this.instanceUI.onDelete();
        }.bind(this));

        $('#modal').modal();
    }
});

module.exports = OpenInstanceProps;
