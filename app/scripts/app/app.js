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
        'ui.keypress',
        'ui.bootstrap',
        'ui.codemirror',
        'ui-notification',
        'cfp.hotkeys',
        'ngDragDrop'
    ])
    .run(function ($rootScope, VERSION) {
        $rootScope.VERSION = VERSION;

        // fade out the loading container when bootstrap is done
        var bootstrapContainer = angular.element('#bootstrap-container');
        bootstrapContainer.fadeOut(function () {
            bootstrapContainer.remove();
        });
    })
    .config(function ($stateProvider, $urlRouterProvider) {
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
    });
