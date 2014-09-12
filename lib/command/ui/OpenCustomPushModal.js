var AbstractCommand = require('../AbstractCommand'),
    Push            = require('../network/Push'),
    CloseModalCmd   = require('./CloseModal'),
    processPath     = require('../../util/process-path'),
    Alert           = require('../../util/Alert');

/**
 * Created by leiko on 11/06/14
 */
var OpenCustomPushModal = AbstractCommand.extend({
    toString: 'OpenCustomPushModal',
    
    construct: function (editor) {
        this.pushCmd = new Push(editor);
        this.closeModalCmd = new CloseModalCmd(editor);
    },
    
    execute: function (e) {
        e.preventDefault();
        
        $('#modal-content').html(templates['custom-push'].render());

        $('#modal-save').off('click');
        $('#modal-save').on('click', function () {
            $('#modal-error').addClass('hide');
            // display loading layer
            this.editor.getUI().showLoadingLayer();
            setTimeout(function () {
                this.pushCmd.execute([$('#node-host').val() + ':' + $('#node-port').val() + processPath($('#node-path').val())], this.editor.getModel(), function (err, uri) {
                    $('#loading-layer').addClass('hide');
                    if (err) {
                        $('#modal-error').html(err.message);
                        $('#modal-error').removeClass('hide');
                        return;
                    }

                    var alert = new Alert();
                    alert.setType('success');
                    alert.setText('Model successfully pushed to '+uri);
                    alert.show(3500);
                    this.closeModalCmd.execute();
                }.bind(this));
            }.bind(this), 1);
        }.bind(this));

        $('#modal').modal();
    }
});

module.exports = OpenCustomPushModal;
