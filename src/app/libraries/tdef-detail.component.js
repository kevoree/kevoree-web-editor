'use strict';
(function () {

  angular.module('editorApp')
    .component('tdefDetail', {
      templateUrl: 'app/libraries/tdef-detail.html',
      bindings: {
        tdef: '<',
        versions: '<',
        disabled: '<',
        onVersionChanged: '&',
        onAddDusToModel: '&',
      },
      controller: TdefDetailController
    });

  TdefDetailController.$inject = ['$q', 'kRegistry'];

  function TdefDetailController($q, kRegistry) {
    var ctrl = this;

    ctrl.versions = null;
    ctrl.selectedVersion = null;
    ctrl.baseUrl = kRegistry.getUrl();
    ctrl.$onChanges = $onChanges;
    ctrl.changeVersion = changeVersion;
    ctrl.addDusToModel = addDusToModel;

    function $onChanges(changes) {
      if (changes.versions && changes.versions.currentValue) {
        ctrl.selectedVersion = ctrl.versions.find(function (tdef) {
          return ctrl.tdef.version === tdef.version;
        });
      }
    }

    function changeVersion() {
      if (!ctrl.disabled) {
        ctrl.onVersionChanged({ tdef: ctrl.selectedVersion });
      }
    }

    function addDusToModel(dus) {
      if (!ctrl.disabled) {
        ctrl.onAddDusToModel({ dus: dus });
      }
    }
  }
})();
