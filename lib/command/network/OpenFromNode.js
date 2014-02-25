var AbstractCommand = require('../AbstractCommand'),
    kevoree         = require('kevoree-library').org.kevoree;

var loader = new kevoree.loader.JSONModelLoader();

/**
 * Created with IntelliJ IDEA.
 * User: leiko
 * Date: 21/02/14
 * Time: 12:03
 */
var OpenFromNode = AbstractCommand.extend({
    toString: 'OpenFromNode',
    
    execute: function (host, port, callback) {
        var uri = 'ws://'+host+':'+port;
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
        }

        ws.onopen = function () {
            ws.send('pull');
        }

        ws.onerror = function () {
            callback(new Error('Unable to connect to node '+uri));
        }
        
    }
});

module.exports = OpenFromNode;