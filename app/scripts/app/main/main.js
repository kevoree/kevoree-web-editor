'use strict';

angular.module('editorApp')
    .config(function ($stateProvider) {
      $stateProvider
          .state('main', {
            parent: 'app',
            url: '/',
            views: {
              'content@': {
                templateUrl: 'scripts/app/main/main.html',
                controller: 'MainCtrl'
              },
              'sidebar@main': {
                templateUrl: 'scripts/app/main/sidebar/sidebar.html',
                controller: 'SidebarCtrl'
              },
              'editor@main': {
                templateUrl: 'scripts/app/main/editor/editor.html',
                controller: 'EditorCtrl'
              },
              'instance@main': {
                templateUrl: 'scripts/app/main/instance/instance.html',
                controller: 'InstanceCtrl'
              }
            }
          });
    });
