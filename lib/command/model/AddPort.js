var AbstractCommand = require('../AbstractCommand');
var kevoree = require('kevoree-library').org.kevoree;

/**
 * Created by leiko on 03/02/14.
 */
var AddPort = AbstractCommand.extend({
    toString: 'AddPort',

    construct: function (editor) {
        this.factory = new kevoree.impl.DefaultKevoreeFactory();
    },

    execute: function (comp, portRef, isProvided) {
        var port = this.factory.createPort();
        port.portTypeRef = portRef;
        
        if (isProvided) comp.addProvided(port);
        else comp.addRequired(port);
        
        return port;
    }
});

module.exports = AddPort;