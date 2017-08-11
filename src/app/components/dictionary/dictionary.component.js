'use strict';
  (function () {

  angular.module('editorApp')
    .component('dictionary', {
      templateUrl: 'app/components/dictionary/dictionary.html',
      bindings: {
        name: '@',
        attrs: '<',
        dictionary: '<',
        fragment: '<'
      },
      controller: DictionaryController
    });

  function DictionaryController() {
    var ctrl = this;

    ctrl.readOnly = false;
    ctrl.isTruish = isTruish;

    if (ctrl.dictionary && ctrl.dictionary.eContainer()) {
      var val = ctrl.dictionary.eContainer().findMetaDataByID('access_mode');
      ctrl.readOnly = val && (val.value === 'read-only');
    }

    function isTruish(val) {
      return (val === 'true' || val === true || val > 0);
    }
  }
})();
