'use strict';

angular.module('editorApp')
  .directive('tabModel', function (kEditor, kModelHelper) {
    return {
      restrict: 'AE',
      templateUrl: 'scripts/app/treeview/tab-model/tab-model.html',
      link: function ($scope) {
        function processData() {
          var model = kEditor.getModel();
          $scope.typeDefs = [
            'Nodes', 'Components', 'Groups', 'Channels'
          ];
          $scope.instancesData = [
            kModelHelper.getNbNodes(model),
            kModelHelper.getNbComponents(model),
            kModelHelper.getNbGroups(model),
            kModelHelper.getNbChannels(model)
          ];

          // $scope.platformsData = [];
          // $scope.platformsLabels = [];
          // var allPlatforms = {};
          // var platforms = {
          //   nodes: {},
          //   groups: {},
          //   channels: {},
          //   components: {}
          // };
          // function processPlatform(instance, type) {
          //   kModelHelper.getPlatforms(instance.typeDefinition)
          //     .forEach(function (platform) {
          //       allPlatforms[platform] = true;
          //       if (platforms[type][platform]) {
          //         platforms[type][platform] += 1;
          //       } else {
          //         platforms[type][platform] = 1;
          //       }
          //     }
          //   );
          // }
          // model.nodes.array.forEach(function (instance) {
          //   processPlatform(instance, 'nodes');
          //   instance.components.array.forEach(function (comp) {
          //     processPlatform(comp, 'components');
          //   });
          // });
          // model.groups.array.forEach(function (instance) {
          //   processPlatform(instance, 'groups');
          // });
          // model.hubs.array.forEach(function (instance) {
          //   processPlatform(instance, 'channels');
          // });
          //
          // $scope.platformsSeries = Object.keys(allPlatforms);
          // $scope.platformsSeries.forEach(function (platform) {
          //   $scope.platformsData.push([
          //     platforms.nodes[platform] || 0,
          //     platforms.components[platform] || 0,
          //     platforms.groups[platform] || 0,
          //     platforms.channels[platform] || 0
          //   ]);
          // });
        }

        processData();
        kEditor.addListener(processData);

        $scope.$on('$destroy', function () {
          kEditor.removeListener(processData);
        });
      }
    };
  });
