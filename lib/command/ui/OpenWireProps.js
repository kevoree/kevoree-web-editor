var AbstractCommand = require('../AbstractCommand'),
    CloseModal      = require('./CloseModal'),
    ModelHelper     = require('../../util/ModelHelper'),
    _s              = require('underscore.string');

/**
 * Created with IntelliJ IDEA.
 * User: leiko
 * Date: 17/02/14
 * Time: 13:34
 */
var OpenWireProps = AbstractCommand.extend({
    toString: 'OpenWireProps',
    
    construct: function (editor, ui) {
        this.ui = ui;
        this.closeModalCmd = new CloseModal(editor);
    },
    
    execute: function (srcInstance, targetInstance) {
        var srcName = srcInstance.name,
            isPort  = false;
        if (ModelHelper.findInstanceType(srcInstance) === 'port') {
            srcName = srcInstance.eContainer().name+'.'+srcInstance.portTypeRef.name+'/'+srcInstance.eContainer().eContainer().name;
            isPort = true;
        }
        
        var data = {
            srcType: _s.capitalize(ModelHelper.findInstanceType(srcInstance)+' name'),
            srcName: srcName,
            disableSrc: isPort,
            targetType: _s.capitalize(ModelHelper.findInstanceType(targetInstance)+' name'),
            targetName: targetInstance.name
        };

        $('#modal-content').html(templates['wire-properties'].render(data));

        $('#modal-save').off('click');
        $('#modal-save').on('click', function () {
            var srcName = $('#src-instance-name').val();
            if (srcInstance.name !== srcName) srcInstance.name = srcName;

            var targetName = $('#target-instance-name').val();
            if (targetInstance.name !== targetName) targetInstance.name = targetName;

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

module.exports = OpenWireProps;