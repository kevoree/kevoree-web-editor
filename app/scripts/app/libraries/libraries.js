'use strict';

angular.module('editorApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('libraries', {
        parent: 'app',
        url: '/libs',
        views: {
          'content@': {
            templateUrl: 'scripts/app/libraries/libraries.html',
            controller: 'LibrariesCtrl',
            controllerAs: 'vm'
          }
        }
      });
  });
