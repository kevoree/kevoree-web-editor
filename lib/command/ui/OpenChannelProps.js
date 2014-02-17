var AbstractCommand     = require('../AbstractCommand'),
    AddDictionary       = require('../model/AddDictionary'),
    AddFragDictionary   = require('../model/AddFragDictionary'),
    CloseModal          = require('./CloseModal'),
    InstancePropsHelper = require('../../util/InstancePropsHelper');

/**
 * Created by leiko on 27/01/14.
 */
var OpenChanProps = AbstractCommand.extend({
    toString: 'OpenChanProps',
    
    construct: function (editor, ui) {
        this.ui = ui;
        this.closeModalCmd = new CloseModal();
        this.addDicCmd = new AddDictionary(editor);
        this.addFragDicCmd = new AddFragDictionary(editor);
    },

    execute: function (instance) {
        // add dictionary if none found
        if (!instance.dictionary) this.addDicCmd.execute(instance);

        // check if fragDictionary have been created, if not, create them
        var bindings = instance.bindings.iterator();
        while (bindings.hasNext()) {
            var binding = bindings.next();
            var node = binding.port.eContainer().eContainer();
            var dic = instance.findFragmentDictionaryByID(node.name);
            if (!dic) this.addFragDicCmd.execute(instance, node);
        }
        
        var data = {
            name:                instance.name,
            versions:            InstancePropsHelper.getVersionsData(instance, this.editor.getModel()),
            dictionary:          InstancePropsHelper.getDictionaryData(instance),
            fragDictionaries:    InstancePropsHelper.getFragDictionariesData(instance),
            hasFragDictionaries: instance.fragmentDictionary.size() > 0
        };
        
        $('#modal-content').html(EditorTemplates['channel-properties'].render(data, {
            instanceProps:      EditorTemplates['instance-props-partial'],
            fragDictionaries:   EditorTemplates['frag-dictionaries-partial']
        }));
        
        InstancePropsHelper.setVersionChangeListener(instance, this.editor.getModel(), this);

        $('#modal-save').off('click');
        $('#modal-save').on('click', function () {
            var name = $('#instance-name').val();
            if (instance.name !== name) instance.name = name;

            // save dictionary
            InstancePropsHelper.saveDictionary(instance, this.editor, data.dictionary);

            // save fragDictionaries
            for (var i in data.fragDictionaries) {
                InstancePropsHelper.saveDictionary(instance, this.editor, data.fragDictionaries[i].dictionary, data.fragDictionaries[i].node);
            }

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

module.exports = OpenChanProps;
