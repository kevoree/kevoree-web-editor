'use strict';

/**
 * @ngdoc function
 * @name editorApp.controller:SettingsCtrl
 * @description
 * # SettingsCtrl
 * Controller of the editorApp options page
 */
angular.module('editorApp')
    .controller('SettingsCtrl', function ($scope, kScript, kRegistry) {
        $scope.isKevSCacheEmpty = function () {
            return kScript.getCacheManager().getAll().length === 0;
        };

        $scope.clearKevSCache = function () {
            kScript.getCacheManager().clear();
        };

        $scope.isLibrariesCacheEmpty = function () {
            return !kRegistry.isInit();
        };

        $scope.clearLibrariesCache = function () {
            kRegistry.clearCache();
        };
    });
