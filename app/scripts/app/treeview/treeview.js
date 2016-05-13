'use strict';

angular.module('editorApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('treeview', {
        parent: 'app',
        url: '/treeview',
        views: {
          'content@': {
            templateUrl: 'scripts/app/treeview/treeview.html',
            controller: 'TreeViewCtrl'
          }
        }
      });
  });
