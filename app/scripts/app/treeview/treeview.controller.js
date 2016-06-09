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
      var oldItems = $scope.items;
      $scope.items = transformModelToTree(kEditor.getModel());
      $scope.selectedItems = [];
      oldItems.forEach(function (oldItem) {
        $scope.items.forEach(function (item) {
          if (oldItem.path === item.path) {
            item.selected = oldItem.selected;
            item.expanded = oldItem.expanded;
            if (oldItem.children && item.children) {
              oldItem.children.forEach(function (oldChild) {
                item.children.forEach(function (child) {
                  if (oldChild.path === child.path) {
                    child.selected = oldChild.selected;
                    child.expanded = oldChild.expanded;
                  }
                });
              });
            }
          }
        });
      });
      $scope.selectedItems = $scope.getSelection();
      $scope.nbInstances = kModelHelper.getNbInstances(kEditor.getModel());
    }

    $scope.items = transformModelToTree(kEditor.getModel());
    $scope.nbInstances = kModelHelper.getNbInstances(kEditor.getModel());
    $scope.showTags = true;
    $scope.selectedItems = [];
    $scope.expandedItems = [];
    $scope.treeOptions = { multiSelection: true };
    $scope.treeOrderBy = 'name';
    $scope.filterExpr = '';
    $scope.filterComparator = false;
    $scope.treeReverse = false;

    var unregister = kEditor.addListener('newModel', processModel);
    var unregister2 = kEditor.addListener('modelUpdate', processModel);

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
      var oldVal = item.selected;
      if (!ctrlKey) {
        $scope.clearSelected();
      } else {
        if (oldVal) {
          $scope.selectedItems.splice($scope.selectedItems.indexOf(item), 1);
        }
      }
      item.selected = !oldVal;
      $scope.items.forEach(function (i) {
        if (i.selected) {
          if ($scope.selectedItems.indexOf(i) === -1) {
            $scope.selectedItems.push(i);
          }
        }
        if (i.children) {
          i.children.forEach(function (i) {
            if (i.selected) {
              if ($scope.selectedItems.indexOf(i) === -1) {
                $scope.selectedItems.push(i);
              }
            }
          });
        }
      });
    };

    $scope.getSelection = function () {
      var selection = [];
      $scope.items.forEach(function (item) {
        if (item.selected) {
          selection.push(item);
        }
        if (item.children) {
          item.children.forEach(function (item) {
            if (item.selected) {
              selection.push(item);
            }
          });
        }
      });
      return selection;
    };

    $scope.collapse = function () {
      $scope.items.forEach(function (item) {
        item.expanded = false;
      });
    };

    $scope.expand = function () {
      $scope.items.forEach(function (item) {
        item.expanded = true;
      });
    };

    $scope.selectAll = function () {
      $scope.selectedItems.length = 0;
      $scope.items.forEach(function (item) {
        item.selected = true;
        $scope.selectedItems.push(item);
        if (item.children) {
          item.children.forEach(function (child) {
            child.selected = true;
            $scope.selectedItems.push(child);
          });
        }
      });
    };

    $scope.selectNodes = function () {
      if (!ctrlKey) {
        $scope.clearSelected();
      }
      $scope.selectedItems = $filter('filter')($scope.items.filter(function (item) {
        return item.type === 'node';
      }), $scope.filterExpr, $scope.filterComparator).map(function (item) {
        item.selected = true;
        return item;
      });
    };

    $scope.selectGroups = function () {
      if (!ctrlKey) {
        $scope.clearSelected();
      }
      $scope.selectedItems = $filter('filter')($scope.items.filter(function (item) {
        return item.type === 'group';
      }), $scope.filterExpr, $scope.filterComparator).map(function (item) {
        item.selected = true;
        return item;
      });
    };

    $scope.selectChannels = function () {
      if (!ctrlKey) {
        $scope.clearSelected();
      }
      $scope.selectedItems = $filter('filter')($scope.items.filter(function (item) {
        return item.type === 'channel';
      }), $scope.filterExpr, $scope.filterComparator).map(function (item) {
        item.selected = true;
        return item;
      });
    };

    $scope.selectComponents = function () {
      if (!ctrlKey) {
        $scope.clearSelected();
      }
      $scope.items.forEach(function (item) {
        if (item.type === 'node') {
          $scope.selectedItems = $filter('filter')(item.children, $scope.filterExpr, $scope.filterComparator).map(function (child) {
            item.expanded = true;
            child.selected = true;
            return child;
          });
        }
      });
    };

    $scope.clearSelected = function () {
      $scope.selectedItems.length = 0;
      $scope.items.forEach(function unselect(item) {
        item.selected = false;
        if (item.children) {
          item.children.forEach(unselect);
        }
      });
    };

    $scope.toggleTags = function () {
      $scope.showTags = !$scope.showTags;
    };

    $scope.reverseSort = function () {
      $scope.treeReverse = !$scope.treeReverse;
    };

    $scope.selectByTag = function (tag) {
      if (!ctrlKey) {
        $scope.clearSelected();
      }
      $scope.items.forEach(function (item) {
        if (item.tags.indexOf(tag) !== -1) {
          item.selected = true;
          $scope.selectedItems.push(item);
        }
        if (item.children) {
          item.children.forEach(function (child) {
            if (child.tags.indexOf(tag) !== -1) {
              item.expanded = true;
              child.selected = true;
              $scope.selectedItems.push(child);
            }
          });
        }
      });
    };

    $scope.$on('$destroy', function () {
      unregister();
      unregister2();
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    });
  });
