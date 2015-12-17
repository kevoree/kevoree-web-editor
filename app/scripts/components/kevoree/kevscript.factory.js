'use strict';

angular.module('editorApp')
    .factory('kScript', function (Notification, storage, kRegistry) {
        var KEY = 'kevs.';
        function CacheManager() {}
        CacheManager.prototype.get = function (key) {
            return storage.get(KEY+key);
        };
        CacheManager.prototype.add = CacheManager.prototype.put = function (key, value) {
            storage.set(KEY+key, value);
        };
        CacheManager.prototype.remove = CacheManager.prototype.delete = function (key) {
            storage.remove(KEY+key);
        };
        CacheManager.prototype.getAll = function () {
            var ret = [];
            storage.keys().forEach(function (key) {
                if (key.slice(0, KEY.length) === KEY) {
                    ret.push(storage.get(key));
                }
            });
            return ret;
        };
        CacheManager.prototype.clear = function () {
            storage.keys().forEach(function (key) {
                if (key.slice(0, KEY.length) === KEY) {
                    storage.remove(key);
                }
            }.bind(this));

            Notification.success({
                title: 'KevScript cache',
                message: 'Cleared successfully',
                delay: 3000
            });
        };

        var kevs = new KevoreeKevscript(new CacheManager());

        var changeUrl = function () {
            var url = new URL(kRegistry.getUrl());
            kevs.setOptions({
                registry: {
                    host: url.hostname,
                    port: url.port
                }
            });
        };

        kRegistry.onUrlChange(changeUrl);
        changeUrl();
        return kevs;
    });
