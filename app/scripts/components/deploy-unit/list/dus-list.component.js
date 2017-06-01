(function () {
  'use strict';

  angular.module('editorApp')
    .component('dusList', {
      templateUrl: 'scripts/components/deploy-unit/list/dus-list.html',
      bindings: { dus: '<' },
      controller: DusListController,
    });

  DusListController.$inject = ['kRegistry'];

  function DusListController(kRegistry) {
    var ctrl = this;

    ctrl.baseUrl = kRegistry.getUrl();
    ctrl.platform = platform;

    function platform(du) {
      if (du.platform) {
        if (du.platform === 'js') {
          return 'javascript';
        } else {
          return du.platform;
        }
      } else {
        if (du.findFiltersByID) {
          var platform = du.findFiltersByID('platform').value;
          if (platform === 'js') {
            return 'javascript';
          } else {
            return platform;
          }
        }
      }
    }
  }
})();
