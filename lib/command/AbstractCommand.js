var Class = require('pseudoclass');

var AbstractCommand = Class({
    toString: 'AbstractCommand',
    
    construct: function (editor)  {
        this.editor = editor;
    },
    
    execute: function () {}
});

module.exports = AbstractCommand;