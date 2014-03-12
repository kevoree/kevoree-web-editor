var Class = require('pseudoclass'),
    Alert = require('../../util/Alert');

/**
 * Created by leiko on 12/03/14.
 */
var AbstractAction = Class({
    toString: 'AbstractAction',

    construct: function (editor) {
        this.editor = editor;
        this.alert = new Alert();
    }
});

module.exports = AbstractAction;