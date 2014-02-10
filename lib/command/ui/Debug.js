var AbstractCommand = require('../AbstractCommand');

/**
 * Created with IntelliJ IDEA.
 * User: leiko
 * Date: 07/02/14
 * Time: 14:33
 */
var Debug = AbstractCommand.extend({
    toString: 'Debug',
    
    execute: function () {
        console.log('====== DEBUG ======');
        console.log(this.editor);
        console.log('====== DEBUG ======');
    }
});

module.exports = Debug;