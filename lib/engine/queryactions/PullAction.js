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
        if (params.host && params.port) {
            var pullCmd = new Pull(this.editor);
            pullCmd.execute([params.host + ':' + params.port + processPath(params.path)], function (err, uri, model) {
                if (err) {
                    this.alert.setType('danger');
                    this.alert.setText('Pull model', err.message);
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