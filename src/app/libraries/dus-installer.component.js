(function () {
  'use strict';

  angular.module('editorApp')
    .component('dusInstaller', {
      templateUrl: 'app/libraries/dus-installer.html',
      bindings: {
        tag: '@',
        dus: '<',
        disabled: '<',
        onAddToModel: '&'
      },
      controller: DusInstallerController,
    });

  DusInstallerController.$inject = [];

  function DusInstallerController() {
    var ctrl = this;

    ctrl.addToModel = addToModel;

    function addToModel() {
      if (!ctrl.disabled) {
        ctrl.onAddToModel({ dus: ctrl.dus });
      }
    }
  }
})();
