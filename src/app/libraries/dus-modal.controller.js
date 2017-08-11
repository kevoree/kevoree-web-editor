'use strict';

(function () {
  angular.module('editorApp')
    .controller('DusModalController', DusModalController);

  DusModalController.$inject = ['tdef', 'currentDus', 'dus'];

  function DusModalController(tdef, currentDus, dus) {
    var vm = this;

    vm.tdef = tdef;
    vm.dus = dus;
    vm.currentDus = currentDus;
  }
})();
