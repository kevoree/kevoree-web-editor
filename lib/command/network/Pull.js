var AbstractCommand = require('../AbstractCommand'),
    kevoree         = require('kevoree-library').org.kevoree;

var loader = new kevoree.loader.JSONModelLoader();

/**
 * Created with IntelliJ IDEA.
 * User: leiko
 * Date: 21/02/14
 * Time: 12:03
 */
var Pull = AbstractCommand.extend({
    toString: 'Pull',
    
    execute: function (host, port, path, callback) {
        if (isNaN(port)) {
            return callback(new Error('Attribute "port" value is not a number ('+port+')'));
        }

        try {
            var uri = 'ws://'+host+':'+port+path;
            var ws = new WebSocket(uri);
            ws.binaryType = "arraybuffer";
            ws.onmessage = function (event) {
                try {
                    var modelStr = '';
                    if (typeof(event.data) === "string") {
                        modelStr = event.data;
                    } else {
                        modelStr = String.fromCharCode.apply(null, new Uint8Array(event.data));
                    }
                    var model = loader.loadModelFromString(modelStr).get(0);
                    callback(null, model);
                } catch (err) {
                    callback(new Error('Unable to pull model from '+uri+'. '+err.message));
                } finally {
                    ws.close();
                }
            };

            ws.onopen = function () {
                ws.send('pull');
            };

            ws.onerror = function () {
                callback(new Error('Unable to connect to '+uri));
            }
        } catch (err) {
            callback(new Error(err.message));
        }
    }
});

module.exports = Pull;