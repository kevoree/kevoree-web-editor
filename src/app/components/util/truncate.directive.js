'use strict';

(function () {
  angular.module('editorApp')
    .component('truncate', {
      template: '<p class="text-justify" ng-bind-html="$ctrl.trustedHtml"></p><a ng-if="$ctrl.expandable" href ng-click="$ctrl.toggle()">{{ $ctrl.toggleText }}</a>',
      bindings: {
        content: '<',
        length: '<'
      },
      controller: TruncateController
    });

  TruncateController.$inject = ['$sce'];

  function TruncateController($sce) {
    var ctrl = this;

    ctrl.expanded = false;
    ctrl.expandable = false;
    ctrl.toggleText = 'Read more';
    ctrl.$onChanges = $onChanges;
    ctrl.toggle = toggle;
    ctrl.expand = expand;
    ctrl.reduce = reduce;

    function $onChanges(changes) {
      if (changes.content.currentValue) {
        ctrl.expanded = true;
        if (!angular.isNumber(ctrl.length)) {
          ctrl.length = 200;
        }
        ctrl.expandable = ctrl.content.length > ctrl.length;
        ctrl.toggleText = 'Reduce';
        reduce();
      }
    }

    function reduce() {
      var modifiedContent = ctrl.content.substr(0, ctrl.length);
      if (ctrl.expandable) {
        modifiedContent += '...';
      }
      ctrl.expanded = false;
      ctrl.toggleText = 'Read more';
      ctrl.trustedHtml = $sce.trustAsHtml(modifiedContent);
    }

    function expand() {
      ctrl.expanded = true;
      ctrl.toggleText = 'Reduce';
      ctrl.trustedHtml = $sce.trustAsHtml(ctrl.content);
    }

    function toggle() {
      if (ctrl.expanded) {
        reduce();
      } else {
        expand();
      }
    }
  }
})();
