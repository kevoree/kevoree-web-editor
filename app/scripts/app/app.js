'use strict';

/**
 * @ngdoc overview
 * @name editorApp
 * @description
 * # editorApp
 *
 * Main module of the application.
 */
angular
  .module('editorApp', [
    'ngAnimate',
    'ngTouch',
    'ui.router',
    'ui.bootstrap',
    'ui.codemirror',
    'ui.utils',
    'ui-notification',
    'cfp.hotkeys',
    'ngDragDrop',
    'semverSort'
  ])
  .run(function($rootScope, VERSION) {
    $rootScope.VERSION = VERSION;

    // fade out the loading container when bootstrap is done
    var bootstrapContainer = angular.element('#bootstrap-container');
    bootstrapContainer.fadeOut(function() {
      bootstrapContainer.remove();
    });
  })
  .config(function($stateProvider, $urlRouterProvider, hotkeysProvider, NotificationProvider) {
    $urlRouterProvider.otherwise('/');

    $stateProvider
      .state('app', {
        abstract: true,
        views: {
          'navbar@': {
            templateUrl: 'scripts/app/navbar/navbar.html',
            controller: 'NavBarCtrl'
          }
        }
      });

    hotkeysProvider.template = '<div class="editor-shortcuts" ng-include src="\'scripts/components/util/hotkeys.html\'" data-ng-if="helpVisible"></div>';

    NotificationProvider.setOptions({
      startTop: 90,
      replaceMessage: true,
      delay: 5000
    });
  });
