var Class       = require('pseudoclass'),
    querystring = require('querystring'),
    // Query Actions:
    PullAction  = require('./queryactions/PullAction');

/**
 * Created by leiko on 04/03/14.
 */
var QueryParser = Class({
    toString: 'QueryParser',

    construct: function (editor) {
        // parse querystring parameters
        var params = querystring.parse(window.location.search.substr(1));

        // register actions
        var actions = [];
        actions.push(new PullAction(editor));

        // execute actions
        for (var i in actions) {
            actions[i].execute(params);
        }
    }
});

module.exports = QueryParser;
