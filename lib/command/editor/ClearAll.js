var AbstractCommand = require('../AbstractCommand');

/**
 * Created with IntelliJ IDEA.
 * User: leiko
 * Date: 19/02/14
 * Time: 18:08
 */
var ClearAll = AbstractCommand.extend({
    toString: 'ClearAll',
    
    execute: function () {
        this.editor.clearAll();
    }
});

module.exports = ClearAll;