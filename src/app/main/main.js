'use strict';

angular.module('editorApp')
	.config(function ($stateProvider) {
  $stateProvider
			.state('main', {
  parent: 'app',
  url: '/',
  views: {
    'content@': {
      templateUrl: 'app/main/main.html',
      controller: 'MainCtrl'
    },
    'typedefs@main': {
      templateUrl: 'app/main/typedefs/typedefs.html',
      controller: 'TypedefsCtrl'
    },
    'editor@main': {
      templateUrl: 'app/main/editor/editor.html',
      controller: 'EditorCtrl'
    },
    'instance@main': {
      templateUrl: 'app/main/instance/instance.html',
      controller: 'InstanceCtrl',
      controllerAs: 'vm'
    }
  },
  onExit: function (ui) {
    ui.editor = null;
  }
});
});
