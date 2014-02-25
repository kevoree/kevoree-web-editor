var AbstractCommand = require('../AbstractCommand'),
    OpenFromNodeCmd = require('../network/OpenFromNode'),
    SetModelCmd     = require('../model/SetModel'),
    CloseModalCmd   = require('./CloseModal');

/**
 * Created by leiko on 27/01/14.
 */
var OpenFromNodeModal = AbstractCommand.extend({
    toString: 'OpenFromNodeModal',
    
    construct: function (editor) {
        this.openFromNodeCmd = new OpenFromNodeCmd(editor);
        this.setModelCmd = new SetModelCmd(editor);
        this.closeModalCmd = new CloseModalCmd(editor);
    },
    
    execute: function (e) {
        e.preventDefault();
        
        $('#modal-content').html(EditorTemplates['open-from-node'].render({
            host: '127.0.0.1',
            port: 9000
        }));

        $('#modal-save').off('click');
        $('#modal-save').on('click', function () {
            $('#modal-error').addClass('hide');
            console.log("TODO: open from node");
            this.openFromNodeCmd.execute($('#node-host').val(), $('#node-port').val(), function (err, model) {
                if (err) {
                    console.log('OPEN FROM NODE FAIL', err.message);
                    $('#modal-error').html(err.message);
                    $('#modal-error').removeClass('hide');
                    return;
                }
                
                this.setModelCmd.execute(model);
                this.closeModalCmd.execute();
            }.bind(this));
        }.bind(this));

        $('#modal').modal();
    }
});

module.exports = OpenFromNodeModal;
