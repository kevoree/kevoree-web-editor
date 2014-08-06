var AbstractCommand = require('../AbstractCommand');
var kevoree = require('kevoree-library').org.kevoree;

/**
 * Created by leiko on 03/02/14.
 */
var AddLibrary = AbstractCommand.extend({
    toString: 'AddLibrary',

    construct: function (editor) {
        this.factory = new kevoree.factory.DefaultKevoreeFactory();
    },

    execute: function (name) {
        var lib = this.factory.createTypeLibrary();
        lib.name = name;
        this.editor.getModel().addLibraries(lib);
        return lib;
    }
});

module.exports = AddLibrary;