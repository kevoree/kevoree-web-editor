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
    .run(function($rootScope, $stateParams, kEditor, kFactory, kRegistry, kWs, Notification, VERSION, KEVOREE_REGISTRY_URL) {
        $rootScope.VERSION = VERSION;
        $rootScope.KEVOREE_REGISTRY_URL = KEVOREE_REGISTRY_URL;

        $rootScope.dndLoad = function(filename, data) {
          var oldModel = kEditor.getModel();
          try {
            var loader = kFactory.createJSONLoader();
            var model = loader.loadModelFromString(data).get(0);
            kEditor.setModel(model, function () {
              Notification.success({
                title: 'Open from file (dnd)',
                message: 'Model loaded from <strong>' + filename + '</strong>'
              });
            });
          } catch (err) {
            console.warn('Error loading model from file');
            console.warn(err.stack);
            Notification.error({
              title: 'Open from file (dnd)',
              message: 'Unable to load a model from <strong>' + filename + '</strong>'
            });
            kEditor.setModel(oldModel);
          }
        };

        $rootScope.keys = function (obj) {
          if (angular.isObject(obj)) {
            return Object.keys(obj);
          }
          return false;
        };

        var url = new URL(kRegistry.getUrl());
        var port;
        if (url.port.length > 0) {
          port = parseInt(url.port);
        } else {
          if (url.protocol === 'http:') {
            port = 80;
          } else {
            port = 443;
          }
        }
        var conf = require('tiny-conf');
        conf.set('registry.host', url.hostname);
        conf.set('registry.port', port);
        conf.set('registry.ssl', url.protocol === 'https:');

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
