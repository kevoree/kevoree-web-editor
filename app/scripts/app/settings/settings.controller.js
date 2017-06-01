'use strict';

/**
 * @ngdoc function
 * @name editorApp.controller:SettingsCtrl
 * @description
 * # SettingsCtrl
 * Controller of the editorApp options page
 */
angular.module('editorApp')
	.controller('SettingsCtrl', function ($scope, kScript, kRegistry, storage, Notification) {
  $scope.registryUrl = kRegistry.getUrl();

  $scope.getUrl = function () {
    return kRegistry.getUrl();
  };

  $scope.changeKevoreeRegistry = function () {
    if ($scope.registryUrl !== kRegistry.getUrl().toString()) {
      try {
        var url = new URL($scope.registryUrl);
        kRegistry.setUrl(url);
        Notification.success({
          title: 'Kevoree Registry',
          message: 'URL successfully updated',
          delay: 3000
        });
      } catch (err) {
        Notification.error({
          title: 'Kevoree Registry',
          message: 'Invalid URL ' + $scope.registryUrl,
          delay: 3000
        });
      }
    }
  };

  $scope.canChangeKevoreeRegistry = function () {
    return $scope.registryUrl !== undefined &&
				$scope.registryUrl !== null &&
				$scope.registryUrl !== kRegistry.getUrl().toString();
  };

  $scope.clearKevScriptCache = function () {
    var prefix = TinyConf.get('cache.root');
    Object.keys(localStorage).forEach(function (key) {
      if (key.startsWith(prefix)) {
        delete localStorage[key];
      }
    });
  };

  $scope.canClearKevScriptCache = function () {
    var prefix = TinyConf.get('cache.root');
    return Object.keys(localStorage).find(function (key) {
      return key.startsWith(prefix);
    });
  };
});
