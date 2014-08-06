var AbstractCommand = require('../AbstractCommand');
var kevoree = require('kevoree-library').org.kevoree;

/**
 * Created by leiko on 03/02/14.
 */
var AddBinding = AbstractCommand.extend({
    toString: 'AddBinding',

    construct: function (editor) {
        this.factory = new kevoree.factory.DefaultKevoreeFactory();
    },

    execute: function (port, chan) {
        var binding = this.factory.createMBinding();
        binding.port = port;
        binding.chan = chan;
        
        chan.addBindings(binding);
        this.editor.getModel().addMBindings(binding);
        
        return binding;
    }
});

module.exports = AddBinding;