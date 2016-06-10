'use strict';

/**
 * @ngdoc function
 * @name editorApp.controller:TreeViewCtrl
 * @description
 * # TreeViewCtrl
 * Controller of the editorApp treeview page
 */
angular.module('editorApp')
  .controller('TreeViewCtrl', function ($scope, $filter, kEditor, kModelHelper, KWE_TAG) {
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
          folded: kModelHelper.isFolded(instance),
          selected: kModelHelper.isSelected(instance)
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
          folded: kModelHelper.isFolded(instance),
          selected: kModelHelper.isSelected(instance),
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
          folded: kModelHelper.isFolded(instance),
          selected: kModelHelper.isSelected(instance)
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
          folded: kModelHelper.isFolded(instance),
          selected: kModelHelper.isSelected(instance)
        };
      }

      return model.nodes.array.map(transformNodeToTreeItem)
        .concat(model.groups.array.map(transformGroupToTreeItem))
        .concat(model.hubs.array.map(transformChannelToTreeItem));
    }

    function processModel() {
      $scope.items = transformModelToTree(kEditor.getModel());
      $scope.selectedItems = kModelHelper.getSelection(kEditor.getModel());
      $scope.nbInstances = kModelHelper.getNbInstances(kEditor.getModel());
    }

    $scope.items = transformModelToTree(kEditor.getModel());
    $scope.nbInstances = kModelHelper.getNbInstances(kEditor.getModel());
    $scope.showTags = true;
    $scope.selectedItems = kModelHelper.getSelection(kEditor.getModel());
    $scope.expandedItems = [];
    $scope.treeOptions = { multiSelection: true };
    $scope.treeOrderBy = 'name';
    $scope.filterExpr = '';
    $scope.filterComparator = false;
    $scope.treeReverse = false;

    var unregister = kEditor.addNewModelListener('treeview', processModel);
    var unregister2 = kEditor.addModelUpdateListener('treeview', processModel);

    var ctrlKey = false;
    function onKeyDown(evt) {
      ctrlKey = evt.ctrlKey;
    }

    function onKeyUp(evt) {
      ctrlKey = evt.ctrlKey;
    }

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    $scope.onClick = function (item) {
      if (!ctrlKey) {
        $scope.clearSelected();
      }
      var instance = kEditor.getModel().findByPath(item.path);
      kModelHelper.setSelected(instance, !item.selected);
    };

    $scope.onExpand = function (item) {
      kModelHelper.setFolded(kEditor.getModel().findByPath(item.path), item.folded);
    };

    $scope.collapse = function () {
      kEditor.disableModelUpdateListeners();
      $scope.items.forEach(function (item) {
        if (item.type === 'node') {
          kModelHelper.setFolded(kEditor.getModel().findByPath(item.path), true);
        }
      });
      kEditor.enableModelUpdateListeners();
      kEditor.invokeModelUpdateListeners();
    };

    $scope.expand = function () {
      kEditor.disableModelUpdateListeners();
      $scope.items.forEach(function (item) {
        if (item.type === 'node') {
          kModelHelper.setFolded(kEditor.getModel().findByPath(item.path), false);
        }
      });
      kEditor.enableModelUpdateListeners();
      kEditor.invokeModelUpdateListeners();
    };

    $scope.selectAll = function () {
      kEditor.disableModelUpdateListeners();
      $scope.items.forEach(function (item) {
        kModelHelper.setSelected(kEditor.getModel().findByPath(item.path), true);
        if (item.children) {
          item.children.forEach(function (child) {
            kModelHelper.setSelected(kEditor.getModel().findByPath(child.path), true);
          });
        }
      });
      kEditor.enableModelUpdateListeners();
      kEditor.invokeModelUpdateListeners();
    };

    $scope.selectNodes = function () {
      kEditor.disableModelUpdateListeners();
      if (!ctrlKey) {
        kModelHelper.getSelection(kEditor.getModel()).forEach(function (instance) {
          kModelHelper.setSelected(instance, false);
        });
      }

      kEditor.getModel().select('/nodes[]')
          .array.forEach(function (instance) {
        kModelHelper.setSelected(instance, true);
      });

      kEditor.enableModelUpdateListeners();
      kEditor.invokeModelUpdateListeners();
    };

    $scope.selectGroups = function () {
      kEditor.disableModelUpdateListeners();
      if (!ctrlKey) {
        kModelHelper.getSelection(kEditor.getModel()).forEach(function (instance) {
          kModelHelper.setSelected(instance, false);
        });
      }

      kEditor.getModel().select('/groups[]')
          .array.forEach(function (instance) {
        kModelHelper.setSelected(instance, true);
      });

      kEditor.enableModelUpdateListeners();
      kEditor.invokeModelUpdateListeners();
    };

    $scope.selectChannels = function () {
      kEditor.disableModelUpdateListeners();
      if (!ctrlKey) {
        kModelHelper.getSelection(kEditor.getModel()).forEach(function (instance) {
          kModelHelper.setSelected(instance, false);
        });
      }

      kEditor.getModel().select('/hubs[]')
          .array.forEach(function (instance) {
        kModelHelper.setSelected(instance, true);
      });

      kEditor.enableModelUpdateListeners();
      kEditor.invokeModelUpdateListeners();
    };

    $scope.selectComponents = function () {
      kEditor.disableModelUpdateListeners();
      if (!ctrlKey) {
        kModelHelper.getSelection(kEditor.getModel()).forEach(function (instance) {
          kModelHelper.setSelected(instance, false);
        });
      }

      kEditor.getModel().select('/nodes[]/components[]')
          .array.forEach(function (instance) {
        kModelHelper.setFolded(instance.eContainer(), false);
        kModelHelper.setSelected(instance, true);
      });

      kEditor.enableModelUpdateListeners();
      kEditor.invokeModelUpdateListeners();
    };

    $scope.clearSelected = function () {
      kEditor.disableModelUpdateListeners();
      kModelHelper.getSelection(kEditor.getModel()).forEach(function (instance) {
        kModelHelper.setSelected(instance, false);
      });
      kEditor.enableModelUpdateListeners();
      kEditor.invokeModelUpdateListeners();
    };

    $scope.toggleTags = function () {
      $scope.showTags = !$scope.showTags;
    };

    $scope.reverseSort = function () {
      $scope.treeReverse = !$scope.treeReverse;
    };

    $scope.selectByTag = function (instances) {
      kEditor.disableModelUpdateListeners();
      if (!ctrlKey) {
        kModelHelper.getSelection(kEditor.getModel()).forEach(function (instance) {
          kModelHelper.setSelected(instance, false);
        });
      }

      instances.forEach(function (instance) {
        kModelHelper.setSelected(instance, true);
        if (instance.metaClassName() === 'org.kevoree.ComponentInstance') {
          kModelHelper.setFolded(instance.eContainer(), false);
        }
      });
      kEditor.enableModelUpdateListeners();
      kEditor.invokeModelUpdateListeners();
    };

    $scope.$on('$destroy', function () {
      unregister();
      unregister2();
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    });
  });
