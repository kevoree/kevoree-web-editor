'use strict';

/**
 * @ngdoc function
 * @name editorApp.controller:TreeViewCtrl
 * @description
 * # TreeViewCtrl
 * Controller of the editorApp treeview page
 */
angular.module('editorApp').controller('TreeViewCtrl', function($scope, $timeout, $filter, $uibModal, kEditor, kModelHelper, kFactory, kWs, kFilterParser, saveFile, hotkeys, Notification) {
  function transformComponentToTreeItem(instance) {
    $scope.nbInstances += 1;
    var item = {
      name: instance.name,
      kevsName: instance.eContainer().name + '.' + instance.name,
      type: 'component',
      typeName: instance.typeDefinition.name,
      version: instance.typeDefinition.version,
      tags: kModelHelper.getTags(instance),
      path: instance.path(),
      selected: kModelHelper.isSelected(instance)
    };
    if (item.selected) {
      $scope.selectedItems.push(item);
    }
    return item;
  }

  function transformNodeToTreeItem(instance) {
    $scope.nbInstances += 1;
    var item = {
      name: instance.name,
      type: 'node',
      typeName: instance.typeDefinition.name,
      version: instance.typeDefinition.version,
      tags: kModelHelper.getTags(instance),
      path: instance.path(),
      folded: kModelHelper.isFolded(instance),
      selected: kModelHelper.isSelected(instance),
      children: instance.components.array.map(transformComponentToTreeItem)
    };
    if (item.selected) {
      $scope.selectedItems.push(item);
    }
    return item;
  }

  function transformGroupToTreeItem(instance) {
    $scope.nbInstances += 1;
    var item = {
      name: instance.name,
      type: 'group',
      typeName: instance.typeDefinition.name,
      version: instance.typeDefinition.version,
      tags: kModelHelper.getTags(instance),
      path: instance.path(),
      selected: kModelHelper.isSelected(instance)
    };
    if (item.selected) {
      $scope.selectedItems.push(item);
    }
    return item;
  }

  function transformChannelToTreeItem(instance) {
    $scope.nbInstances += 1;
    var item = {
      name: instance.name,
      type: 'channel',
      typeName: instance.typeDefinition.name,
      version: instance.typeDefinition.version,
      tags: kModelHelper.getTags(instance),
      path: instance.path(),
      selected: kModelHelper.isSelected(instance)
    };
    if (item.selected) {
      $scope.selectedItems.push(item);
    }
    return item;
  }

  function transformModelToTree(model) {
    return model.nodes.array.map(transformNodeToTreeItem).concat(model.groups.array.map(transformGroupToTreeItem)).concat(model.hubs.array.map(transformChannelToTreeItem));
  }

  function expandItemByPath(path) {
    for (var i = 0; i < $scope.items.length; i++) {
      if ($scope.items[i].path === path) {
        if ($scope.items[i].folded) {
          $scope.items[i].folded = false;
          kModelHelper.setFolded(kEditor.getModel().findByPath($scope.items[i].path), false);
        }
        return;
      }
    }
  }

  function processModel() {
    $scope.nbInstances = 0;
    $scope.selectedItems = [];
    $scope.items = transformModelToTree(kEditor.getModel());
  }

  $scope.items = [];
  $scope.limit = 30;
  $scope.nbInstances = 0;
  $scope.showTags = true;
  $scope.selectedItems = [];
  $scope.filterExpr = '';
  $scope.filterComparator = false;
  $scope.treeReverse = false;
  $scope.query = null;

  var unregister = kEditor.addNewModelListener('treeview', processModel);
  processModel();

  var ctrlPressed = false;
  function onKeyDown(evt) {
    ctrlPressed = evt.ctrlKey;
  }

  function onKeyUp(evt) {
    ctrlPressed = evt.ctrlKey;
  }

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  $scope.loadMore = function() {
    if ($scope.items.length > $scope.limit) {
      $scope.limit += 10;
    }
  };

  $scope.onClick = function(item) {
    var selected = item.selected;
    if (!ctrlPressed) {
      if (selected && $scope.selectedItems.length > 1 && $scope.selectedItems.indexOf(item) !== -1) {
        selected = !selected;
      }
      $scope.selectedItems.forEach(function(item) {
        kModelHelper.setSelected(kEditor.getModel().findByPath(item.path), false);
        item.selected = false;
      });
      $scope.selectedItems.length = 0;
    }
    kModelHelper.setSelected(kEditor.getModel().findByPath(item.path), !selected);
    item.selected = !selected;
    if (item.selected) {
      $scope.selectedItems.push(item);
    } else {
      $scope.selectedItems.splice($scope.selectedItems.indexOf(item), 1);
    }
  };

  $scope.onExpand = function(item) {
    item.folded = !item.folded;
    kModelHelper.setFolded(kEditor.getModel().findByPath(item.path), item.folded);
  };

  $scope.collapse = function() {
    $scope.items.forEach(function(item) {
      if (item.type === 'node') {
        item.folded = true;
        kModelHelper.setFolded(kEditor.getModel().findByPath(item.path), true);
      }
    });
  };

  $scope.expand = function() {
    $scope.items.forEach(function(item) {
      if (item.type === 'node') {
        item.folded = false;
        kModelHelper.setFolded(kEditor.getModel().findByPath(item.path), false);
      }
    });
  };

  $scope.selectAll = function() {
    $scope.selectedItems.length = 0;
    $scope.items.forEach(function(item) {
      item.selected = true;
      var instance = kEditor.getModel().findByPath(item.path);
      kModelHelper.setSelected(instance, true);
      $scope.selectedItems.push(item);
      if (item.children) {
        item.children.forEach(function(child) {
          child.selected = true;
          item.folded = false;
          kModelHelper.setFolded(instance, false);
          kModelHelper.setSelected(kEditor.getModel().findByPath(child.path), true);
          $scope.selectedItems.push(child);
        });
      }
    });
  };

  function selectByType(type) {
    if (!ctrlPressed) {
      $scope.clearSelected();
    }

    $scope.items.forEach(function(item) {
      if (item.type === type) {
        item.selected = true;
        $scope.selectedItems.push(item);
        kModelHelper.setSelected(kEditor.getModel().findByPath(item.path), true);
      }
    });
  }

  $scope.selectNodes = function() {
    selectByType('node');
  };

  $scope.selectGroups = function() {
    selectByType('group');
  };

  $scope.selectChannels = function() {
    selectByType('channel');
  };

  $scope.selectComponents = function() {
    if (!ctrlPressed) {
      $scope.clearSelected();
    }

    $scope.items.forEach(function(item) {
      if (item.type === 'node') {
        if (item.children) {
          item.children.forEach(function(child) {
            item.folded = false;
            child.selected = true;
            kModelHelper.setFolded(kEditor.getModel().findByPath(item.path), false);
            kModelHelper.setSelected(kEditor.getModel().findByPath(child.path), true);
            $scope.selectedItems.push(child);
          });
        }
      }
    });
  };

  $scope.selectByTag = function(items) {
    if (!ctrlPressed) {
      $scope.clearSelected();
    }

    items.forEach(function(item) {
      item.selected = true;
      $scope.selectedItems.push(item);
      var instance = kEditor.getModel().findByPath(item.path);
      kModelHelper.setSelected(instance, true);
      if (item.type === 'component') {
        expandItemByPath(instance.eContainer().path());
      }
    });
  };

  $scope.clearSelected = function() {
    $scope.selectedItems.forEach(function clear(item) {
      item.selected = false;
      kModelHelper.setSelected(kEditor.getModel().findByPath(item.path), false);
      if (item.children) {
        item.children.forEach(clear);
      }
    });
    $scope.selectedItems.length = 0;
  };

  $scope.toggleTags = function() {
    $scope.showTags = !$scope.showTags;
  };

  $scope.reverseSort = function() {
    $scope.treeReverse = !$scope.treeReverse;
  };

  $scope.createItem = function(type, instance, parentNode) {
    switch (type) {
      case 'node':
        $scope.items.push(transformNodeToTreeItem(instance));
        break;

      case 'group':
        $scope.items.push(transformGroupToTreeItem(instance));
        break;

      case 'channel':
        $scope.items.push(transformChannelToTreeItem(instance));
        break;

      case 'component':
        for (var i = 0; i < $scope.items.length; i++) {
          if ($scope.items[i].path === parentNode.path()) {
            $scope.items[i].children.push(transformComponentToTreeItem(instance));
            break;
          }
        }
        break;
    }
  };

  $scope.clearFilter = function() {
    $scope.query = null;
    $scope.filterExpr = '';
    $scope.filterError = null;
  };

  var filterTimeout;
  $scope.onFilterExprChanged = function() {
    $timeout.cancel(filterTimeout);
    filterTimeout = $timeout(function() {
      $scope.parseFilterExpr();
    }, 300);
  };

  $scope.parseFilterExpr = function() {
    if ($scope.filterExpr.length === 0) {
      $scope.query = null;
      $scope.filterError = null;
    } else {
      try {
        $scope.query = kFilterParser.parse($scope.filterExpr);
        $scope.filterError = null;
      } catch (err) {
        $scope.query = null;
        $scope.filterError = err.name + ': "' + err.found + '" at col.' + err.location.start.column;
      }
    }
  };

  $scope.open = function(evt) {
    evt.preventDefault();

    $scope.onFileLoaded = function(filename, data) {
      $timeout(function() {
        $scope.loading = true;
        $timeout(function() {
          var oldModel = kEditor.getModel();
          try {
            var loader = kFactory.createJSONLoader();
            var model = loader.loadModelFromString(data).get(0);
            kEditor.setModel(model);
            Notification.success({
              title: 'Open from file',
              message: 'Model loaded from <strong>' + filename + '</strong>'
            });
          } catch (err) {
						console.warn('[treeview.controller.open()] Error loading model file'); // eslint-disable-line
						console.error(err.stack); // eslint-disable-line
            Notification.error({
              title: 'Open from file',
              message: 'Unable to load a model from <strong>' + filename + '</strong>'
            });
            kEditor.setModel(oldModel);
          } finally {
            $scope.loading = false;
          }
        });
      });
    };
    angular.element('input#file').click();
  };

  $scope.merge = function(evt) {
    evt.preventDefault();
    $scope.onFileLoaded = function mergeModel(filename, data) {
      $timeout(function() {
        $scope.loading = true;
        $timeout(function() {
          try {
            var loader = kFactory.createJSONLoader();
            var compare = kFactory.createModelCompare();
            var model = loader.loadModelFromString(data).get(0);
            compare.merge(model, kEditor.getModel()).applyOn(model);
            kEditor.setModel(model);
            Notification.success({
              title: 'Merge from file',
              message: 'Model merged with <strong>' + filename + '</strong>'
            });
          } catch (err) {
						console.warn('[treeview.controller.merge()] Error loading model file'); // eslint-disable-line
						console.error(err.stack); // eslint-disable-line
            Notification.error({
              title: 'Merge from file',
              message: 'Unable to merge the model with <strong>' + filename + '</strong>'
            });
          } finally {
            $scope.loading = false;
          }
        });
      });
    };
    angular.element('input#file').click();
  };

  $scope.openFromNode = function(evt) {
    evt.preventDefault();

    $uibModal.open({
      templateUrl: 'scripts/components/util/host-port-path.modal.html',
      size: 'md',
      controller: function($scope, $uibModalInstance) {
        $scope.title = 'Open from node';
        $scope.action = 'Open';
        $scope.host = '127.0.0.1';
        $scope.port = 9000;
        $scope.path = '/';

        $uibModalInstance.rendered.then(function() {
          $timeout(function() {
            angular.element('#host').focus();
          }, 250);
        });

        $scope.confirm = function() {
          $scope.closeError();

          kWs.getModel($scope.host, $scope.port, $scope.path, function(err, model, url) {
            if (err) {
              $timeout(function() {
                $scope.error = err.message;
              });
            } else {
              kEditor.setModel(model);
              Notification.success({
                title: $scope.title,
                message: 'Model loaded from <strong>' + url + '</strong>'
              });
              $uibModalInstance.close();
            }
          });
        };

        $scope.closeError = function() {
          $scope.error = null;
        };
      }
    });
  };

  $scope.mergeFromNode = function(evt) {
    evt.preventDefault();

    $uibModal.open({
      templateUrl: 'scripts/components/util/host-port-path.modal.html',
      size: 'md',
      controller: function($scope, $uibModalInstance, kWs) {
        $scope.title = 'Merge from node';
        $scope.action = 'Merge';
        $scope.host = '127.0.0.1';
        $scope.port = 9000;
        $scope.path = '/';

        $uibModalInstance.rendered.then(function() {
          $timeout(function() {
            angular.element('#host').focus();
          }, 250);
        });

        $scope.confirm = function() {
          $scope.closeError();

          kWs.getModel($scope.host, $scope.port, $scope.path, function(err, model, url) {
            if (err) {
              $timeout(function() {
                $scope.error = err.message;
              });
            } else {
              var compare = kFactory.createModelCompare();
              compare.merge(model, kEditor.getModel()).applyOn(model);
              kEditor.setModel(model);
              Notification.success({
                title: $scope.title,
                message: 'Model merged with <strong>' + url + '</strong>'
              });
              $uibModalInstance.close();
            }
          });
        };

        $scope.closeError = function() {
          $scope.error = null;
        };
      }
    });
  };

  $scope.save = function(evt, filename) {
    evt.preventDefault();
    var serializer = kFactory.createJSONSerializer();

    try {
			// serialize model
      var modelStr = serializer.serialize(kEditor.getModel());
			// prettify model
      modelStr = JSON.stringify(JSON.parse(modelStr), null, 4);
			// download model on client
      saveFile.save(modelStr, filename, '.json', 'application/json');
    } catch (err) {
      Notification.error({title: 'Save', message: 'Unable to serialize model to JSON'});
    }
  };

  $scope.deleteAll = function(evt) {
    evt.preventDefault();
    $scope.deleteInstances(evt);
    kEditor.getModel().removeAllPackages();
  };

  $scope.deleteInstances = function(evt) {
    evt.preventDefault();
    var model = kEditor.getModel();
    model.removeAllNodes();
    model.removeAllGroups();
    model.removeAllHubs();
    model.removeAllMBindings();
    model.removeAllRepositories();
    processModel();
  };

  $scope.deleteSelection = function(evt) {
    evt.preventDefault();
    var selection = kModelHelper.getSelection(kEditor.getModel());
    if (selection.length === 0) {
      Notification.warning({title: 'Delete selection', message: 'Nothing selected'});
    } else {
      selection.forEach(function(instance) {
        instance.delete();
      });
      processModel();
    }
  };

  $scope.toggleShortcutHelp = function() {
    hotkeys.toggleCheatSheet();
  };

  hotkeys.bindTo($scope).add({combo: 'ctrl+o', description: 'Open a model from a file', callback: $scope.open});

  hotkeys.bindTo($scope).add({combo: 'ctrl+m', description: 'Merge a model from a file with current model in editor', callback: $scope.merge});

  hotkeys.bindTo($scope).add({combo: 'ctrl+shift+o', description: 'Open a model from a node', callback: $scope.openFromNode});

  hotkeys.bindTo($scope).add({combo: 'ctrl+shift+m', description: 'Merge a model from a node with current model in editor', callback: $scope.mergeFromNode});

  hotkeys.bindTo($scope).add({combo: 'ctrl+shift+g', description: 'Connect to a Web Socket server and stay synced with it', callback: $scope.connectSync});

  hotkeys.bindTo($scope).add({
    combo: 'ctrl+s',
    description: 'Save the current model into a JSON file',
    callback: function(evt) {
      evt.preventDefault();
      var saveFile = $scope.save;
      $uibModal.open({
        templateUrl: 'scripts/components/util/filename.modal.html',
        size: 'sm',
        controller: function($scope, $uibModalInstance) {
          $scope.title = 'Save model';
          $scope.body = 'Would you like to save your current model to a file?';
          $scope.filename = 'model' + (Math.floor(Math.random() * (1000 - 100)) + 100);
          $uibModalInstance.rendered.then(function() {
            $timeout(function() {
              angular.element('#filename').focus();
            }, 250);
          });

          $scope.save = function() {
            function endsWith(str, suffix) {
              return str.indexOf(suffix, str.length - suffix.length) !== -1;
            }
            var suffix = '.json';
            if (endsWith($scope.filename, suffix)) {
              $scope.filename = $scope.filename.substr(0, $scope.filename.length - suffix.length);
            }
            saveFile(evt, $scope.filename);
            $uibModalInstance.close();
          };
        }
      });
    }
  });

  hotkeys.bindTo($scope).add({combo: 'alt+shift+d', description: 'Delete everything in the current model', callback: $scope.deleteAll});

  hotkeys.bindTo($scope).add({combo: 'alt+shift+i', description: 'Delete instances in the current model', callback: $scope.deleteInstances});

  hotkeys.bindTo($scope).add({combo: 'del', description: 'Delete selected instances in the current model', callback: $scope.deleteSelection});

  hotkeys.bindTo($scope).add({
    combo: 'ctrl+a',
    description: 'Select all instances',
    callback: function(evt) {
      evt.preventDefault();
      $scope.selectAll();
    }
  });

  $scope.$on('$destroy', function() {
    unregister();
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    $timeout.cancel(filterTimeout);
  });
});
