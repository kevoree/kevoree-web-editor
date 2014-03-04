var Class       = require('pseudoclass'),
    querystring = require('querystring'),
    Alert       = require('../util/Alert'),
    SetModel    = require('../command/editor/SetModel'),
    Pull        = require('../command/network/Pull');

/**
 * Created by leiko on 04/03/14.
 */
var QueryParser = Class({
    toString: 'QueryParser',

    construct: function (editor) {
        var params = querystring.parse(window.location.search.substr(1));
        var alert = new Alert();

        if (params.host && params.port) {
            var pullCmd = new Pull(editor);
            pullCmd.execute(params.host, params.port, function (err, model) {
                if (err) {
                    alert.setType('danger');
                    alert.setText('Pull model', err.message);
                    alert.show(5000);
                    return;
                }

                var setModel = new SetModel(editor);
                setModel.execute(model);
            });
        }
    }
});

module.exports = QueryParser;
