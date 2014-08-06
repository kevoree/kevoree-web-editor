var AbstractCommand = require('../AbstractCommand'),
    kevoree         = require('kevoree-library').org.kevoree,
    SmartSocket     = require('smart-socket');

var factory = new kevoree.factory.DefaultKevoreeFactory();
var loader = factory.createJSONLoader();

/**
 * Created with IntelliJ IDEA.
 * User: leiko
 * Date: 21/02/14
 * Time: 12:03
 */
var Pull = AbstractCommand.extend({
    toString: 'Pull',

    construct: function () {
        this.timeoutID = null;
    },

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
                this.timeoutID = setTimeout(function () {
                    callback(new Error('Unable to pull model from <strong>'+ws.url+'</strong><br/>Timeout exceeded (5000ms)'));
                }, 5000);
                var modelStr = '';
                try {
                    if (typeof(event.data) === "string") {
                        modelStr = event.data;
                    } else {
                        modelStr = String.fromCharCode.apply(null, new Uint8Array(event.data));
                    }

                    var model = loader.loadModelFromString(modelStr).get(0);
                    clearTimeout(this.timeoutID);
                    callback(null, ws.url, model);
                    ws.close();

                } catch (err) {
                    console.warn('Discarded received message', modelStr);
                }
            }.bind(this));

            ss.on('error', function (ws) {
                errors.push(ws.url);
            });

            ss.on('loopEnd', function () {
                if (!succeed) {
                    ss.close(true);
                    var ipv6Error = '';
                    if (errorIpv6.length > 0) {
                        ipv6Error = '<br/>(nb: '+errorIpv6.join(', ')+' discarded: IPv6 connection is not implemented)';
                    }
                    callback(new Error('Unable to connect to '+errors.join(', ')+'.'+ipv6Error));
                }
            });

            ss.start();
        }
    }
});

module.exports = Pull;