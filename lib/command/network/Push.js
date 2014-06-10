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

    /**
     *
     * @param host
     * @param port
     * @param path
     * @param model
     * @param callback
     */
    execute: function (host, port, path, model, callback) {
        if (isNaN(port)) {
            callback(new Error('Attribute "port" value is not a number ('+port+')'));
            return;
        }

        var uri = 'ws://'+host+':'+port+path;
        
        try {
            var modelStr = serializer.serialize(model);
            console.log('Trying to push model to '+uri);
            var ws = new WebSocket(uri);
            ws.onopen = function onOpen() {
                ws.send('push/'+modelStr);
                ws.close();
                console.log('Model pushed successfully to '+uri);
                callback();
            };
            ws.onerror = function onError() {
                callback(new Error('Unable to connect to '+uri));
            }
            
        } catch (err) {
            callback(new Error(err.message));
        }
    }
});

module.exports = Push;