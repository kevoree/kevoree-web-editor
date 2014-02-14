var AbstractCommand = require('../AbstractCommand'),
    CloseModal      = require('./CloseModal'),
    ModelHelper     = require('../../util/ModelHelper'),
    _s              = require('underscore.string');

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
        var data;
        
        if (otherInstance) {
            data = {
                title: 'Wire properties: ' + instance.name + ' <-> ' + otherInstance.name,
                nameLabel: _s.capitalize(ModelHelper.findInstanceType(instance))+' name',
                name: instance.name,
                otherNameLabel: _s.capitalize(ModelHelper.findInstanceType(otherInstance))+' name',
                otherName: otherInstance.name
            };
            
        } else {
            data = {
                title: 'Instance properties: '+ instance.name,
                name: instance.name
            };
        }
        $('#modal-content').html(EditorTemplates['instance-properties'].render(data));

        $('#modal-save').off('click');
        $('#modal-save').on('click', function () {
            var name = $('#instance-name').val();
            instance.name = name;
            if (otherInstance) {
                var otherName = $('#other-instance-name').val();
                otherInstance.name = otherName;
            }
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
