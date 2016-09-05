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
        'hljs',
        'infinite-scroll'
    ])
    .run(function($rootScope, $stateParams, kEditor, kFactory, kRegistry, kWs, Notification, VERSION) {
        $rootScope.VERSION = VERSION;

        $rootScope.dndLoad = function(filename, data) {
          var oldModel = kEditor.getModel();
          var loader = kFactory.createJSONLoader();
          var model;
          try {
            model = loader.loadModelFromString(data).get(0);
          } catch (err) {
            console.error('[app.dndLoad()] Error loading model file');
            console.error(err.stack);
            Notification.error({
              title: 'Open from file (dnd)',
              message: 'Unable to load a model from <strong>' + filename + '</strong>'
            });
            kEditor.setModel(oldModel);
            return;
          }

          kEditor.setModel(model, function (err) {
            if (err) {
              Notification.error({
                title: 'Open from file (dnd)',
                message: 'Unable to load model from <strong>' + filename + '</strong><br/>' + err.message,
                delay: 15000
              });
            } else {
              Notification.success({
                title: 'Open from file (dnd)',
                message: 'Model loaded from <strong>' + filename + '</strong>'
              });
            }
          });
        };

        $rootScope.keys = function (obj) {
          if (angular.isObject(obj)) {
            return Object.keys(obj);
          }
          return false;
        };

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
