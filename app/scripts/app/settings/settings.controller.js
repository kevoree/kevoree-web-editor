'use strict';

/**
 * @ngdoc function
 * @name editorApp.controller:SettingsCtrl
 * @description
 * # SettingsCtrl
 * Controller of the editorApp options page
 */
angular.module('editorApp')
    .controller('SettingsCtrl', function ($scope, kScript) {
        $scope.isKevSCacheEmpty = function () {
            return kScript.getCacheManager().getAll().length === 0;
        };

        $scope.clearKevSCache = function () {
            kScript.getCacheManager().clear();
        };
    });
