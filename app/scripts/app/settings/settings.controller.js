'use strict';

/**
 * @ngdoc function
 * @name editorApp.controller:SettingsCtrl
 * @description
 * # SettingsCtrl
 * Controller of the editorApp options page
 */
angular.module('editorApp')
    .controller('SettingsCtrl', function ($scope, kScript, kRegistry, storage, Notification, AUTOLOAD_KEVS) {
      $scope.registryUrl = kRegistry.getUrl();
      $scope.state = {
        autoLoadKevs: storage.get(AUTOLOAD_KEVS, true)
      };

      $scope.changeKevoreeRegistry = function () {
          if ($scope.registryUrl !== kRegistry.getUrl()) {
              try {
                  new URL($scope.registryUrl);
                  kRegistry.setUrl($scope.registryUrl);
              } catch (err) {
                  Notification.error({
                      title: 'Kevoree Registry',
                      message: 'Invalid URL '+$scope.registryUrl,
                      delay: 3000
                  });
              }
          }
      };

      $scope.canChangeKevoreeRegistry = function () {
          return $scope.registryUrl.length > 0 &&
              $scope.registryUrl !== kRegistry.getUrl();
      };

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

      $scope.setAutoLoadKevs = function (state) {
        $scope.state.autoLoadKevs = state;
        storage.set(AUTOLOAD_KEVS, $scope.state.autoLoadKevs);
      };
    });
