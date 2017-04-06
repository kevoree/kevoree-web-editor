angular.module('editorApp')
	.config(function ($stateProvider, $urlRouterProvider, hotkeysProvider, hljsServiceProvider, NotificationProvider) {
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

		TinyConf.set('cache', {
			root: 'kevs-cache-',
			ttl: 1000 * 60 * 60 * 24 // 24 hours
		});
	});
