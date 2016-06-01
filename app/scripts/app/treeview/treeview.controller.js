'use strict';

/**
 * @ngdoc function
 * @name editorApp.controller:TreeViewCtrl
 * @description
 * # TreeViewCtrl
 * Controller of the editorApp treeview page
 */
angular.module('editorApp')
  .controller('TreeViewCtrl', function ($scope, $timeout, $state, kEditor, kModelHelper) {
    function transformModelToTree(model) {
      function transformComponentToTreeItem(comp) {
        return {
          type: 'component',
          name: comp.name,
          tags: kModelHelper.getInstanceTags(comp),
          path: comp.path()
        };
      }

      function transformNodeToTreeItem(node) {
        return {
          type: 'node',
          name: node.name,
          tags: kModelHelper.getInstanceTags(node),
          path: node.path(),
          children: node.components.array.map(transformComponentToTreeItem)
        };
      }

      function transformGroupToTreeItem(group) {
        return {
          type: 'group',
          name: group.name,
          tags: kModelHelper.getInstanceTags(group),
          path: group.path()
        };
      }

      function transformChannelToTreeItem(chan) {
        return {
          type: 'channel',
          name: chan.name,
          tags: kModelHelper.getInstanceTags(chan),
          path: chan.path()
        };
      }

      return model.nodes.array.map(transformNodeToTreeItem)
        .concat(model.groups.array.map(transformGroupToTreeItem))
        .concat(model.hubs.array.map(transformChannelToTreeItem));
    }

    function processModel() {
      $scope.tree = transformModelToTree(kEditor.getModel());
      $scope.nbInstances = kModelHelper.getNbInstances(kEditor.getModel());
    }

    $scope.tree = transformModelToTree(kEditor.getModel());
    $scope.nbInstances = kModelHelper.getNbInstances(kEditor.getModel());
    $scope.showTags = true;
    $scope.selectedItems = [];
    $scope.expandedItems = [];
    $scope.treeOptions = { multiSelection: true };
    $scope.treeOrderBy = 'name';

    kEditor.addListener(processModel);

    $scope.collapse = function () {
      $scope.expandedItems = [];
    };

    $scope.expand = function () {
      $scope.expandedItems = $scope.tree.slice(0);
    };

    $scope.selectNodes = function () {
      $scope.selectedItems = $scope.tree.slice(0).filter(function (item) {
        return item.type === 'node';
      });
    };

    $scope.selectGroups = function () {
      $scope.selectedItems = $scope.tree.slice(0).filter(function (item) {
        return item.type === 'group';
      });
    };

    $scope.selectChannels = function () {
      $scope.selectedItems = $scope.tree.slice(0).filter(function (item) {
        return item.type === 'channel';
      });
    };

    $scope.selectComponents = function () {
      $scope.expand();
      $scope.selectedItems = [];
      $scope.tree.forEach(function (item) {
        if (item.type === 'node') {
          $scope.selectedItems = $scope.selectedItems.concat(item.children.slice(0));
        }
      });
    };

    $scope.clearSelected = function () {
      $scope.selectedItems = [];
    };

    $scope.toggleTags = function () {
      $scope.showTags = !$scope.showTags;
    };

    $scope.$on('$destroy', function () {
      kEditor.removeListener(processModel);
    });
  });
