'use strict';

/**
 * @ngdoc function
 * @name editorApp.controller:NavBarCtrl
 * @description
 * # NavBarCtrl
 * Controller of the editorApp navigation bar
 */
angular.module('editorApp')
  .controller('NavBarCtrl', function ($state) {
    this.isCollapsed = true;
    this.$state = $state;
  });
