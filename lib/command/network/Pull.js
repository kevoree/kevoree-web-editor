var AbstractCommand = require('../AbstractCommand'),
    kevoree         = require('kevoree-library').org.kevoree,
    SmartSocket     = require('smart-socket');

var loader = new kevoree.loader.JSONModelLoader();

/**
 * Created with IntelliJ IDEA.
 * User: leiko
 * Date: 21/02/14
 * Time: 12:03
 */
var Pull = AbstractCommand.extend({
    toString: 'Pull',

    /**
     *
     * @param uris
     * @param callback
     */
    execute: function (uris, callback) {
        var i, errors = [], errorIpv6 = [], succeed = false;

        for (i=0; i < uris.length; i++) {
            if (uris[i].split(':').length > 2) {
                errorIpv6.push(uris[i]);
            }
        }

        for (i=0; i < errorIpv6.length; i++) {
            var idx = uris.indexOf(errorIpv6[i]);
            uris.splice(idx, 1);
        }

        if (uris.length === 0) {
            callback(new Error('IPv6 connection is not implemented: unable to connect to '+errorIpv6.join(', ')));

        } else {
            var ss = new SmartSocket({
                addresses: uris,
                timeout: 3000
            });

            ss.on('open', function (ws) {
                succeed = true;
                ss.stop();
                ws.binaryType = "arraybuffer";
                ws.send('pull');
            });

            ss.on('message', function (ws, event) {
                try {
                    var modelStr = '';
                    if (typeof(event.data) === "string") {
                        modelStr = event.data;
                    } else {
                        modelStr = String.fromCharCode.apply(null, new Uint8Array(event.data));
                    }
                    var model = loader.loadModelFromString(modelStr).get(0);
                    callback(null, ws.url, model);
                } catch (err) {
                    callback(new Error('Unable to pull model from '+ws.url+'. '+err.message));
                } finally {
                    ws.close();
                }
            });

            ss.on('error', function (ws) {
                errors.push(ws.url);
            });

            ss.on('loopEnd', function () {
                if (!succeed) {
                    ss.close(true);
                    callback(new Error('Unable to connect to '+errors.join(', ')+'. <br/>(nb: '+errorIpv6.join(', ')+' discarded: IPv6 connection is not implemented)'));
                }
            });

            ss.start();
        }
    }
});

module.exports = Pull;