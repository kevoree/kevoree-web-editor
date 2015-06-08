'use strict';

angular.module('editorApp')
    .service('kWs', function (kFactory) {
        return {

            /**
             *
             * @param host
             * @param port
             * @param path
             * @param callback
             */
            getModel: function (host, port, path, callback) {
                if (!path) {
                    path = '/';
                } else {
                    if (path.substr(0, 1) !== '/') {
                        path = '/' + path;
                    }
                }

                var ws = new WebSocket('ws://'+host+':'+port+path);

                ws.onopen = function () {
                    ws.send('pull');
                };

                ws.onmessage = function (msg) {
                    try {
                        var loader = kFactory.createJSONLoader();
                        var model = loader.loadModelFromString(msg.data).get(0);
                        callback(null, model, 'ws://'+host+':'+port+path);
                    } catch (err) {
                        console.warn('[ws.factory.getModel()] Error parsing model from message:');
                        console.warn('[ws.factory.getModel()] msg.data='+msg.data);
                        callback(new Error('Unable to load received model from ws://'+host+':'+port+path), null, 'ws://'+host+':'+port+path);
                    }
                };

                ws.onerror = function (err) {
                    err = new Error('Unable to connect to ws://'+host+':'+port+path);
                    callback(err, null, 'ws://'+host+':'+port+path);
                };

                ws.close = function () {
                    console.log('ws close', host, port, path);
                };
            }
        };
    });