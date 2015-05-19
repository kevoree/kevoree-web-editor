'use strict';

angular.module('editorApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('settings', {
        parent: 'app',
        url: '/settings',
        views: {
          'content@': {
            templateUrl: 'scripts/app/settings/settings.html',
            controller: 'SettingsCtrl'
          }
        }
      });
  });
