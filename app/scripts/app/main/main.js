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
					'typedefs@main': {
						templateUrl: 'scripts/app/main/typedefs/typedefs.html',
						controller: 'TypedefsCtrl'
					},
					'editor@main': {
						templateUrl: 'scripts/app/main/editor/editor.html',
						controller: 'EditorCtrl'
					},
					'instance@main': {
						templateUrl: 'scripts/app/main/instance/instance.html',
						controller: 'InstanceCtrl'
					}
				},
				onExit: function (ui) {
					ui.editor = null;
				}
			});
	});
