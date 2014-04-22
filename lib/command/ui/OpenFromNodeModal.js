var AbstractCommand = require('../AbstractCommand'),
    Pull = require('../network/Pull'),
    SetModelCmd     = require('../editor/SetModel'),
    CloseModalCmd   = require('./CloseModal'),
    processPath     = require('../../util/process-path');

/**
 * Created by leiko on 27/01/14.
 */
var OpenFromNodeModal = AbstractCommand.extend({
    toString: 'OpenFromNodeModal',
    
    construct: function (editor) {
        this.pullCmd = new Pull(editor);
        this.closeModalCmd = new CloseModalCmd(editor);
        this.action = 'Open';
    },
    
    execute: function (e) {
        e.preventDefault();
        
        $('#modal-content').html(EditorTemplates['from-node'].render({
            action: this.action,
            host: '127.0.0.1',
            port: 9000,
            path: ''
        }));

        $('#modal-save').off('click');
        $('#modal-save').on('click', function () {
            $('#modal-error').addClass('hide');
            // display loading layer
            this.editor.getUI().showLoadingLayer();
            setTimeout(function () {
                this.pullCmd.execute($('#node-host').val(), $('#node-port').val(), processPath($('#node-path').val()), function (err, model) {
                    this.pullCallback(err, model);
                }.bind(this));
            }.bind(this), 1);
        }.bind(this));

        $('#modal').modal();
    },

    pullCallback: function (err, model) {
        if (err) {
            $('#loading-layer').addClass('hide');
            $('#modal-error').html(err.message);
            $('#modal-error').removeClass('hide');
            return;
        }

        var setModelCmd = new SetModelCmd(this.editor);
        setModelCmd.execute(model);
        this.closeModalCmd.execute();
    }
});

module.exports = OpenFromNodeModal;
