var AbstractAction = require('./AbstractAction'),
    Pull           = require('../../command/network/Pull'),
    SetModel       = require('../../command/editor/SetModel'),
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