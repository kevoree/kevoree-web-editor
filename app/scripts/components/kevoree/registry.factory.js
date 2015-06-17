'use strict';

angular.module('editorApp')
    .factory('kRegistry', function ($http, $q, kFactory, KEVOREE_REGISTRY_URL) {
        return {
            /**
             * Registry root model cache
             */
            model: null,

            /**
             * Returns a Promise with the Registry root model
             * @returns {*}
             */
            getRoot: function () {
                var that = this;
                return $q(function (resolve, reject) {
                    if (that.model) {
                        resolve(that.model);
                    } else {
                        $http({
                            method: 'POST',
                            url: KEVOREE_REGISTRY_URL,
                            headers: {
                                'Content-Type': 'text/plain'
                            },
                            data: [ '/packages[*]' ]
                        })
                            .then(function (res) {
                                try {
                                    var modelStr = JSON.stringify(res.data);
                                    var loader = kFactory.createJSONLoader();
                                    that.model = loader.loadModelFromString(modelStr).get(0);
                                    resolve(that.model);
                                } catch (err) {
                                    console.log('error', err.message);
                                    reject(new Error('Unable to load Kevoree Registry model'));
                                }
                            })
                            .catch(function () {
                                reject(new Error('Unable to retrieve content from Kevoree Registry'));
                            });
                    }
                });
            },

            /**
             * Returns a Promise with the requested model if any
             * @param path a Kevoree Modeling Framework path (eg. /foo[*]/bar[*])
             * @returns {*}
             */
            'get': function (path) {
                return $q(function (resolve, reject) {
                    $http({
                        method: 'POST',
                        url: KEVOREE_REGISTRY_URL,
                        headers: {
                            'Content-Type': 'text/plain'
                        },
                        data: [ path ]
                    })
                        .then(function (res) {
                            try {
                                var modelStr = JSON.stringify(res.data);
                                var loader = kFactory.createJSONLoader();
                                resolve(loader.loadModelFromString(modelStr).get(0));
                            } catch (err) {
                                console.log('error', err.message);
                                reject(new Error('Unable to load Kevoree Registry model for "'+path+'"'));
                            }
                        })
                        .catch(function () {
                            reject(new Error('Unable to retrieve content from Kevoree Registry'));
                        });
                });
            },

            clearCache: function () {
                this.model = null;
            }
        };
    });