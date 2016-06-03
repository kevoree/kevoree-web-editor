'use strict';

/**
 * @ngdoc function
 * @name editorApp.controller:TreeViewCtrl
 * @description
 * # TreeViewCtrl
 * Controller of the editorApp treeview page
 */
angular.module('editorApp')
  .controller('TreeViewCtrl', function ($scope, $filter, kEditor, kModelHelper) {
    function transformModelToTree(model) {
      function transformComponentToTreeItem(instance) {
        return {
          name: instance.name,
          kevsName: instance.eContainer().name + '.' + instance.name,
          type: 'component',
          typeName: instance.typeDefinition.name,
          version: instance.typeDefinition.version,
          platforms: kModelHelper.getPlatforms(instance.typeDefinition),
          tags: kModelHelper.getInstanceTags(instance),
          path: instance.path(),
          isFiltered: false
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
          isFiltered: false,
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
          path: instance.path(),
          isFiltered: false
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
          path: instance.path(),
          isFiltered: false
        };
      }

      return model.nodes.array.map(transformNodeToTreeItem)
        .concat(model.groups.array.map(transformGroupToTreeItem))
        .concat(model.hubs.array.map(transformChannelToTreeItem));
    }

    function processModel() {
      $scope.tree = transformModelToTree(kEditor.getModel());
      $scope.nbInstances = kModelHelper.getNbInstances(kEditor.getModel());
      if ($scope.selectedItems.length > 0) {
        var oldSelection = $scope.selectedItems;
        $scope.selectedItems = [];
        oldSelection.forEach(function (oldItem) {
          for (var i=0; i < $scope.tree.length; i++) {
            if ($scope.tree[i].name === oldItem.name) {
              $scope.selectedItems.push($scope.tree[i]);
            }
          }
        });
      }
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
      $scope.selectedItems = $filter('filter')($scope.tree.filter(function (item) {
        return item.type === 'node';
      }), $scope.filterExpr, $scope.filterComparator);
    };

    $scope.selectGroups = function () {
      $scope.selectedItems = $filter('filter')($scope.tree.filter(function (item) {
        return item.type === 'group';
      }), $scope.filterExpr, $scope.filterComparator);
    };

    $scope.selectChannels = function () {
      $scope.selectedItems = $filter('filter')($scope.tree.filter(function (item) {
        return item.type === 'channel';
      }), $scope.filterExpr, $scope.filterComparator);
    };

    $scope.selectComponents = function () {
      $scope.expand();
      $scope.selectedItems = [];
      $scope.tree.forEach(function (item) {
        if (item.type === 'node') {
          $scope.selectedItems = $scope.selectedItems.concat(
            $filter('filter')(item.children, $scope.filterExpr, $scope.filterComparator)
          );
        }
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

    $scope.selectByTag = function (tag) {
      $scope.selectedItems = [];
      var types = [];
      $scope.tree.forEach(function (item) {
        if (item.tags.indexOf(tag) !== -1) {
          if (types.indexOf(item.type) === -1) {
            types.push(item.type);
          }
          $scope.selectedItems.push(item);
        }
        if (item.children) {
          item.children.forEach(function (item) {
            if (item.tags.indexOf(tag) !== -1) {
              if (types.indexOf(item.type) === -1) {
                types.push(item.type);
              }
              $scope.selectedItems.push(item);
            }
          });
        }
      });

      if (types.indexOf('component') !== -1) {
        $scope.expand();
      }
    };

    $scope.$on('$destroy', function () {
      kEditor.removeListener(processModel);
    });
  });
