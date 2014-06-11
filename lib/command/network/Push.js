var AbstractCommand = require('../AbstractCommand'),
    kevoree         = require('kevoree-library').org.kevoree,
    SmartSocket     = require('smart-socket');

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
     * @param uris Array
     * @param model
     * @param callback
     */
    execute: function (uris, model, callback) {
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
                try {
                    var modelStr = serializer.serialize(model);
                    ws.send('push/'+modelStr);
                    succeed = true;
                    ss.close(true);
                    console.log('Model pushed successfully to '+ws.url);
                    callback(null, ws.url);
                } catch (err) {
                    callback(new Error(err.message));
                }
            });

            ss.on('error', function (ws) {
                errors.push(ws.url);
            });

            ss.on('loopEnd', function () {
                ss.close(true);
                if (!succeed) {
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

module.exports = Push;