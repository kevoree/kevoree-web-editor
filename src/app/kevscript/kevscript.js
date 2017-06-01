'use strict';

angular.module('editorApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('kevscript', {
        parent: 'app',
        url: '/kevscript',
        views: {
          'content@': {
            templateUrl: 'app/kevscript/kevscript.html',
            controller: 'KevScriptCtrl'
          }
        }
      });
  });
