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
      function transformComponentToTreeItem(instance) {
        return {
          name: instance.name,
          type: 'component',
          typeName: instance.typeDefinition.name,
          version: instance.typeDefinition.version,
          platforms: kModelHelper.getPlatforms(instance.typeDefinition),
          tags: kModelHelper.getInstanceTags(instance),
          path: instance.path()
        };
      }

      function transformNodeToTreeItem(instance) {
        return {
          name: instance.name,
          type: 'node',
          typeName: instance.typeDefinition.name,
          version: instance.typeDefinition.version,
          platforms: kModelHelper.getPlatforms(instance.typeDefinition),
          tags: kModelHelper.getInstanceTags(instance),
          path: instance.path(),
          children: instance.components.array.map(transformComponentToTreeItem)
        };
      }

      function transformGroupToTreeItem(instance) {
        return {
          name: instance.name,
          type: 'group',
          typeName: instance.typeDefinition.name,
          version: instance.typeDefinition.version,
          platforms: kModelHelper.getPlatforms(instance.typeDefinition),
          tags: kModelHelper.getInstanceTags(instance),
          path: instance.path()
        };
      }

      function transformChannelToTreeItem(instance) {
        return {
          name: instance.name,
          type: 'channel',
          typeName: instance.typeDefinition.name,
          version: instance.typeDefinition.version,
          platforms: kModelHelper.getPlatforms(instance.typeDefinition),
          tags: kModelHelper.getInstanceTags(instance),
          path: instance.path()
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
    $scope.filterExpr = '';
    $scope.filterComparator = false;
    $scope.treeReverse = false;

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

    $scope.selectShown = function () {
      $scope.tree.forEach(function (item) {
        console.log(item);
      });
    };

    $scope.clearSelected = function () {
      $scope.selectedItems = [];
    };

    $scope.toggleTags = function () {
      $scope.showTags = !$scope.showTags;
    };

    $scope.reverseSort = function () {
      $scope.treeReverse = !$scope.treeReverse;
    };

    $scope.$on('$destroy', function () {
      kEditor.removeListener(processModel);
    });
  });
