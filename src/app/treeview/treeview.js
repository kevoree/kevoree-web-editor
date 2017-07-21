'use strict';

angular.module('editorApp')
	.config(function ($stateProvider) {
  $stateProvider
			.state('treeview', {
  parent: 'app',
  url: '/treeview',
  views: {
    'content@': {
      templateUrl: 'app/treeview/treeview.html',
      controller: 'TreeViewCtrl'
    }
  },
  onExit: function (kEditor) {
    kEditor.removeModelUpdateListeners('treeview');
  }
});
});
