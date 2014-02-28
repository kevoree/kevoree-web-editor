var AbstractCommand = require('../AbstractCommand'),
    Pull = require('../network/Pull'),
    SetModelCmd     = require('../editor/SetModel'),
    CloseModalCmd   = require('./CloseModal');

/**
 * Created by leiko on 27/01/14.
 */
var OpenFromNodeModal = AbstractCommand.extend({
    toString: 'OpenFromNodeModal',
    
    construct: function (editor) {
        this.pullCmd = new Pull(editor);
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
            this.pullCmd.execute($('#node-host').val(), $('#node-port').val(), function (err, model) {
                if (err) {
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
