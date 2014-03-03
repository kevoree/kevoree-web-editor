var AbstractCommand = require('../AbstractCommand'),
    kevoree         = require('kevoree-library').org.kevoree;

var serializer = new kevoree.serializer.JSONModelSerializer();

/**
 * Created with IntelliJ IDEA.
 * User: leiko
 * Date: 21/02/14
 * Time: 12:03
 */
var Push = AbstractCommand.extend({
    toString: 'Push',

    execute: function (host, port, model, callback) {
        if (isNaN(port)) {
            return callback(new Error('Attribute "port" value is not a number ('+port+')'));
        }

        var uri = 'ws://'+host+':'+port;
        
        try {
            var modelStr = serializer.serialize(model);
            console.log('Trying to push model to '+uri);
            var ws = new WebSocket(uri);
            ws.onopen = function onOpen() {
                ws.send('push/'+modelStr);
                ws.close();
                console.log('Model pushed successfully to '+uri);
                return callback();
            };
            ws.onerror = function onError() {
                return callback(new Error('Unable to connect to '+uri));
            }
            
        } catch (err) {
            return callback(new Error('Unable to serialize given model'));
        }
    }
});

module.exports = Push;