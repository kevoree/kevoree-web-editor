(function () {
  'use strict';

  angular.module('editorApp')
    .component('dusList', {
      templateUrl: 'app/components/deploy-unit/dus-list.html',
      bindings: { dus: '<' },
      controller: DusListController,
    });

  DusListController.$inject = ['kRegistry'];

  function DusListController(kRegistry) {
    var ctrl = this;

    ctrl.baseUrl = kRegistry.getUrl();
    ctrl.platform = platform;

    function platform(du) {
      var platform;
      if (du.platform) {
        if (du.platform === 'js') {
          platform = 'javascript';
        } else {
          platform = du.platform;
        }
      } else {
        if (du.findFiltersByID) {
          var p = du.findFiltersByID('platform').value;
          if (p === 'js') {
            platform = 'javascript';
          } else {
            platform = p;
          }
        }
      }
      return platform;
    }
  }
})();
