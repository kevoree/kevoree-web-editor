var AbstractCommand = require('../AbstractCommand');

/**
 * Created with IntelliJ IDEA.
 * User: leiko
 * Date: 19/02/14
 * Time: 18:08
 */
var ClearInstances = AbstractCommand.extend({
    toString: 'ClearInstances',
    
    execute: function () {
        this.editor.clearInstances();
    }
});

module.exports = ClearInstances;