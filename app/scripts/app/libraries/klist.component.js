(function () {
  'use strict';

  angular.module('editorApp')
    .component('klist', {
      templateUrl: 'scripts/app/libraries/klist.html',
      bindings: {
        parent: '@', // @ for string constant
        title: '@',
        placeholder: '@',
        props: '<', // < for one-way binding
        elems: '<', // = for two-way binding
        onSelect: '&', // & for output func
        disabled: '<'
      },
      controller: KListController,
    });

  function KListController() {
    var ctrl = this;

    if (!angular.isDefined(ctrl.props))      { ctrl.props = []; }
    if (!angular.isDefined(ctrl.selectable)) { ctrl.selectable = true; }

    ctrl.select = function (elem) {
      if (!ctrl.disabled) {
        ctrl.onSelect({ elem: elem });
      }
    };
  }
})();
