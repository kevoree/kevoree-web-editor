'use strict';

angular.module('editorApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('settings', {
        parent: 'app',
        url: '/settings',
        views: {
          'content@': {
            templateUrl: 'app/settings/settings.html',
            controller: 'SettingsCtrl'
          }
        }
      });
  });
