'use strict';

/**
 * @ngdoc function
 * @name editorApp.controller:TreeViewCtrl
 * @description
 * # TreeViewCtrl
 * Controller of the editorApp treeview page
 */
angular.module('editorApp')
  .controller('TreeViewCtrl', function ($scope, $timeout, $state, kEditor, kFactory) {
    function transformModelToTree(model) {
      function transformComponentToTreeItem(comp) {
        return {
          name: comp.name,
          tags: [],
          path: comp.path()
        };
      }

      function transformNodeToTreeItem(node) {
        return {
          name: node.name,
          tags: [],
          path: node.path(),
          children: node.components.array.map(transformComponentToTreeItem)
        };
      }

      function transformGroupToTreeItem(group) {
        return {
          name: group.name,
          path: group.path()
        };
      }

      function transformChannelToTreeItem(chan) {
        return {
          name: chan.name,
          path: chan.path()
        };
      }

      return model.nodes.array.map(transformNodeToTreeItem);
        // .concat(model.groups.array.map(transformGroupToTreeItem))
        // .concat(model.hubs.array.map(transformChannelToTreeItem));
    }

    function onModelHandler() {
      $scope.tree = transformModelToTree(kEditor.getModel());
    }

    $scope.selectedNodes = [];
    $scope.expandedNodes = [];
    $scope.treeOptions = { multiSelection: true };
    $scope.treeReverseOrder = false;
    $scope.treeOrderBy = [ 'name' ];
    $scope.tree = transformModelToTree(kEditor.getModel());

    kEditor.addListener(onModelHandler);

    $scope.onSelect = function (node, selected) {
      console.log('onSelect', node, selected);
    };

    $scope.collapse = function () {
      $scope.expandedNodes = [];
    };

    $scope.expand = function () {
      $scope.expandedNodes = $scope.tree;
    };

    $scope.selectNodes = function () {
      $scope.selectedNodes = $scope.tree;
    };

    $scope.clearSelected = function () {
      $scope.selectedNodes = [];
    };

    $scope.toggleSort = function () {
      $scope.treeReverseOrder = !$scope.treeReverseOrder;
      console.log('toggleSort', $scope.treeReverseOrder);
    };

    $scope.beautify = function (node) {
      var serializer = kFactory.createJSONSerializer();
      return JSON.stringify(JSON.parse(serializer.serialize(kEditor.getModel().findByPath(node.path))), null, 2);
    };

    $scope.$on('$destroy', function () {
      kEditor.removeListener(onModelHandler);
    });
  });
