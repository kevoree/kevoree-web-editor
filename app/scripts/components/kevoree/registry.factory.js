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

            ///**
            // *
            // * @param path
            // * @returns {*}
            // */
            //'get': function (path) {
            //    if (this.model) {
            //        console.log('model');
            //        return $q(function (resolve) {
            //            resolve(this.model);
            //        }.bind(this));
            //    } else {
            //        console.log('no model');
            //        return $http({
            //            method: 'POST',
            //            url: KEVOREE_REGISTRY_URL,
            //            headers: {
            //                'Content-Type': 'text/plain'
            //            },
            //            data: [ path ]
            //        });
            //    }
            //},

            clearCache: function () {
                this.model = null;
            }
        };
    });