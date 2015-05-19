'use strict';

/**
 * @ngdoc function
 * @name editorApp.controller:NavBarCtrl
 * @description
 * # NavBarCtrl
 * Controller of the editorApp navigation bar
 */
angular.module('editorApp')
  .controller('NavBarCtrl', function ($scope, $state) {
    $scope.isCollapsed = true;
    $scope.$state = $state;
  });
