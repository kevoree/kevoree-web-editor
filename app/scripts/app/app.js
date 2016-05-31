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
        'treeControl',
        'cfp.hotkeys',
        'ngDragDrop',
        'semverSort',
        'hljs',
        'chart.js'
    ])
    .run(function($rootScope, $stateParams, kEditor, kRegistry, kWs, Notification, VERSION, KEVOREE_REGISTRY_URL) {
        $rootScope.VERSION = VERSION;
        $rootScope.KEVOREE_REGISTRY_URL = KEVOREE_REGISTRY_URL;

        kRegistry.init()
            .catch(function (err) {
                Notification.error({
                    title: 'Kevoree Registry',
                    message: err.message,
                    delay: 10000
                });
            })
            .finally(function() {
                // fade out the loading container when bootstrap is done
                angular.element('#bootstrap-container').fadeOut(function() {
                    this.remove();
                    if ($stateParams.host) {
                      kWs.getModel($stateParams.host, $stateParams.port || 9000, $stateParams.path || '', function(err, model, url) {
                        if (err) {
                          Notification.error({
                            title: 'Open from node',
                            message: 'Unable to load model from <strong>' + url + '</strong>'
                          });
                        } else {
                          kEditor.setModel(model);
                          Notification.success({
                            title: 'Open from node',
                            message: 'Model loaded from <strong>' + url + '</strong>'
                          });
                        }
                      });
                    }
                });
            });
    })
    .config(function($stateProvider, $urlRouterProvider, hotkeysProvider, hljsServiceProvider, NotificationProvider) {
        $urlRouterProvider.otherwise('/');

        $stateProvider
            .state('app', {
                abstract: true,
                url: '?host&port&path',
                views: {
                    'navbar@': {
                        templateUrl: 'scripts/app/navbar/navbar.html',
                        controller: 'NavBarCtrl'
                    }
                }
            });

        hotkeysProvider.template = '<div class="editor-shortcuts" ng-include src="\'scripts/components/util/hotkeys.html\'" data-ng-if="helpVisible"></div>';

        hljsServiceProvider.setOptions({
          tabReplace: '  '
        });

        NotificationProvider.setOptions({
            startTop: 90,
            replaceMessage: true,
            delay: 5000
        });
    });
