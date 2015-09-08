'use strict';

angular.module('editorApp')
    .service('kWs', function (kFactory) {
        function cleanPath(path) {
            if (!path) {
                path = '/';
            } else {
                if (path.substr(0, 1) !== '/') {
                    path = '/' + path;
                }
            }
            return path;
        }

        return {

            /**
             *
             * @param host
             * @param port
             * @param path
             * @param callback
             * @returns {WebSocket}
             */
            getModel: function (host, port, path, callback) {
                var answer = false,
                    failed = false,
                    ws = null,
                    timeout = setTimeout(function () {
                        answer = true;
                        failed = true;
                        try { ws.close(); } catch (err) { /* ignore */ }
                        var err = new Error('Connection with ws://'+host+':'+port+path+' timed out');
                        callback(err, null, 'ws://'+host+':'+port+path);
                    }, 5000);
                path = cleanPath(path);

                try {
                    ws = new WebSocket('ws://'+host+':'+port+path);

                    ws.onopen = function () {
                        clearTimeout(timeout);
                        ws.send('pull');
                    };

                    ws.onmessage = function (msg) {
                        try {
                            var loader = kFactory.createJSONLoader();
                            var model = loader.loadModelFromString(msg.data).get(0);
                            answer = true;
                            ws.close();
                            callback(null, model, 'ws://'+host+':'+port+path);
                        } catch (err) {
                            clearTimeout(timeout);
                            console.warn('[ws.factory.getModel()] Error parsing model from message:');
                            console.warn('[ws.factory.getModel()] msg.data='+msg.data);
                            answer = true;
                            ws.close();
                            callback(new Error('Unable to load received model from ws://'+host+':'+port+path), null, 'ws://'+host+':'+port+path);
                        }
                    };

                    ws.onerror = function (err) {
                        failed = true;
                        err = new Error('Unable to connect to ws://'+host+':'+port+path);
                        clearTimeout(timeout);
                        callback(err, null, 'ws://'+host+':'+port+path);
                    };

                    ws.onclose = function () {
                      if (!answer && !failed) {
                        clearTimeout(timeout);
                        var err = new Error('Connection with ws://'+host+':'+port+path+' closed');
                        callback(err, null, 'ws://'+host+':'+port+path);
                      }
                    };
                } catch (err) {
                    clearTimeout(timeout);
                    callback(new Error('Unable to load received model from ws://'+host+':'+port+path), null, 'ws://'+host+':'+port+path);
                }

                return ws;
            },

            /**
             *
             * @param model
             * @param host
             * @param port
             * @param path
             * @param callback
             * @returns {WebSocket|null}
             */
            pushModel: function (model, host, port, path, callback) {
                var modelStr,
                    sent = false,
                    failed = false,
                    ws = null,
                    timeout = setTimeout(function () {
                        sent = true;
                        failed = true;
                        try { ws.close(); } catch (err) { /* ignore */ }
                        var err = new Error('Connection with ws://'+host+':'+port+path+' timed out');
                        callback(err, null, 'ws://'+host+':'+port+path);
                    }, 5000);

                try {
                    var serializer = kFactory.createJSONSerializer();
                    modelStr = serializer.serialize(model);
                } catch (err) {
                    var error = new Error('Unable to serialize current model');
                    callback(error);
                    return null;
                }

                if (modelStr) {
                    path = cleanPath(path);

                    ws = new WebSocket('ws://'+host+':'+port+path);

                    ws.onopen = function () {
                        clearTimeout(timeout);
                        ws.send('push/'+modelStr);
                        sent = true;
                        ws.close();
                        callback();
                    };

                    ws.onerror = function (err) {
                        failed = true;
                        err = new Error('Unable to connect to ws://'+host+':'+port+path);
                        clearTimeout(timeout);
                        callback(err);
                    };

                    ws.onclose = function () {
                        if (!sent && !failed) {
                            clearTimeout(timeout);
                            var err = new Error('Connection with ws://'+host+':'+port+path+' closed');
                            callback(err, null, 'ws://'+host+':'+port+path);
                        }
                    };
                }

                return ws;
            }
        };
    });
