var AbstractCommand     = require('../AbstractCommand'),
    AddDictionary       = require('../model/AddDictionary'),
    CloseModal          = require('./CloseModal'),
    InstancePropsHelper = require('../../util/InstancePropsHelper');

/**
 * Created by leiko on 27/01/14.
 */
var OpenCompProps = AbstractCommand.extend({
    toString: 'OpenCompProps',
    
    construct: function (editor, ui) {
        this.ui = ui;
        this.closeModalCmd = new CloseModal(editor);
        this.addDicCmd = new AddDictionary(editor);
    },

    execute: function (instance) {
        // add dictionary if none found
        if (!instance.dictionary) this.addDicCmd.execute(instance);
        
        var data = {
            name:       instance.name,
            versions:   InstancePropsHelper.getVersionsData(instance, this.editor.getModel()),
            dictionary: InstancePropsHelper.getDictionaryData(instance)
        };
        
        $('#modal-content').html(EditorTemplates['component-properties'].render(data, {
            instanceProps: EditorTemplates['instance-props-partial']
        }));

        InstancePropsHelper.setVersionChangeListener(instance, this.editor.getModel(), this);

        $('#modal-save').off('click');
        $('#modal-save').on('click', function () {
            var name = $('#instance-name').val();
            if (instance.name !== name) instance.name = name;

            // save dictionary
            InstancePropsHelper.saveDictionary(instance, this.editor, data.dictionary);

            this.closeModalCmd.execute();
        }.bind(this));
        
        $('#delete-instance').off('click');
        $('#delete-instance').on('click', function () {
            this.ui.onDelete();
            this.editor.getUI().update();
        }.bind(this));

        $('#modal').modal();
    }
});

module.exports = OpenCompProps;
