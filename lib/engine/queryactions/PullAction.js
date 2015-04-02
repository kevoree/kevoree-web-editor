var AbstractAction = require('./AbstractAction'),
    Pull           = require('../../command/network/Pull'),
    SetModel       = require('../../command/editor/SetModel'),
    LSKeys         = require('../../config/local-storage-keys'),
    processPath    = require('../../util/process-path');

/**
 * Created by leiko on 12/03/14.
 */
var PullAction = AbstractAction.extend({
    toString: 'PullAction',

    execute: function (params) {
        params.port = params.port || 9000;
        if (params.host) {
            var pullCmd = new Pull(this.editor);
            this.editor.getUI().showLoadingLayer();

            localStorage.setItem(LSKeys.CUSTOM_PUSH_HOST, params.host);
            localStorage.setItem(LSKeys.CUSTOM_PUSH_PORT, params.port);
            localStorage.setItem(LSKeys.CUSTOM_PUSH_PATH, params.path);

            pullCmd.execute([params.host + ':' + params.port + processPath(params.path)], function (err, uri, model) {
                if (err) {
                    this.editor.getUI().hideLoadingLayer();
                    this.alert.setType('danger');
                    this.alert.setHTML('Pull model', err.message);
                    this.alert.show(5000);
                    return;
                }

                var setModel = new SetModel(this.editor);
                setModel.execute(model);
            }.bind(this));
        }
    }
});

module.exports = PullAction;
