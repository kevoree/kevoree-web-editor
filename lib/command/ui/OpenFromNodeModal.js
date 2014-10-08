var AbstractCommand = require('../AbstractCommand'),
    Pull            = require('../network/Pull'),
    SetModelCmd     = require('../editor/SetModel'),
    CloseModalCmd   = require('./CloseModal'),
    processPath     = require('../../util/process-path'),
    DefaultValues   = require('../../config/defaults'),
    kevoree         = require('kevoree-library').org.kevoree;

/**
 * Created by leiko on 27/01/14.
 */
var OpenFromNodeModal = AbstractCommand.extend({
    toString: 'OpenFromNodeModal',

    construct: function (editor) {
        this.pullCmd = new Pull(editor);
        this.closeModalCmd = new CloseModalCmd(editor);
        this.action = 'Open';
        this.actionCmd = new SetModelCmd(this.editor);
    },

    preProcess: function (model) {
        console.log('PREPROCESS', this.toString());
        var factory = new kevoree.factory.DefaultKevoreeFactory();
        factory.root(model);
    },

    execute: function (e) {
        e.preventDefault();

        $('#modal-content').html(templates['from-node'].render({
            action: this.action,
            host: '127.0.0.1',
            port: 9000,
            path: ''
        }));

        $('#runjs-shared-group')
            .off('click')
            .on('click', function () {
                $('#node-host').val(DefaultValues.RUNJS_HOST);
                $('#node-port').val(DefaultValues.RUNJS_PORT);
                $('#node-path').val(DefaultValues.RUNJS_PATH);
            });

        $('#modal-save')
            .off('click')
            .on('click', function () {
                $('#modal-error').addClass('hide');
                // display loading layer
                this.editor.getUI().showLoadingLayer();
                setTimeout(function () {
                    this.pullCmd.execute([$('#node-host').val() + ':' + $('#node-port').val() + processPath($('#node-path').val())], function (err, uri, model) {
                        if (err) {
                            $('#loading-layer').addClass('hide');
                            $('#modal-error')
                                .html(err.message)
                                .removeClass('hide');
                            return;
                        }

                        this.preProcess(model);
                        this.actionCmd.execute(model);

                        this.closeModalCmd.execute();
                    }.bind(this));
                }.bind(this), 1);
            }.bind(this));

        $('#modal').modal();
    }
});

module.exports = OpenFromNodeModal;
