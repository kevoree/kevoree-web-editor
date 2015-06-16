'use strict';

angular.module('editorApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('libraries', {
        parent: 'app',
        url: '/libs/{fqn}',
        views: {
          'content@': {
            templateUrl: 'scripts/app/libraries/libraries.html',
            controller: 'LibrariesCtrl'
          }
        }
      });
  });
