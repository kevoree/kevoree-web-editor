'use strict';

/**
 * @ngdoc function
 * @name editorApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the editorApp main content div
 */
angular.module('editorApp')
  .controller('MainCtrl', function($scope, $timeout, $stateParams, $modal, kEditor, hotkeys, saveFile, ui, kModelHelper, kFactory, kWs, Notification) {
    if ($stateParams.host) {
      kWs.getModel($stateParams.host, $stateParams.port || 9000, $stateParams.path || '', function(err, model, url) {
        if (err) {
          Notification.error({
            title: 'Open from node',
            message: 'Unable to load model from <strong>' + url + '</strong>'
          });
        } else {
          kEditor.setModel(model);
          Notification.success({
            title: 'Open from node',
            message: 'Model loaded from <strong>' + url + '</strong>'
          });
        }
      });
    }

    $scope.loading = false;
    $scope.synced = false;
    var syncWS;

    $scope.onFileLoaded = function() {};

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
              console.warn('[main.controller.open()] Error loading model file');
              console.error(err.stack);
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

    $scope.dndLoad = function(filename, data) {
      $timeout(function() {
        $scope.loading = true;
        $timeout(function() {
          var oldModel = kEditor.getModel();
          try {
            var loader = kFactory.createJSONLoader();
            var model = loader.loadModelFromString(data).get(0);
            kEditor.setModel(model);
            Notification.success({
              title: 'Open from file (dnd)',
              message: 'Model loaded from <strong>' + filename + '</strong>'
            });
          } catch (err) {
            console.warn('[main.controller.dndLoad()] Error loading model file');
            console.error(err.stack);
            Notification.error({
              title: 'Open from file (dnd)',
              message: 'Unable to load a model from <strong>' + filename + '</strong>'
            });
            kEditor.setModel(oldModel);
          } finally {
            $scope.loading = false;
          }
        });
      });
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
              console.warn('[main.controller.merge()] Error loading model file');
              console.error(err.stack);
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

      $modal.open({
        templateUrl: 'scripts/components/util/host-port-path.modal.html',
        size: 'md',
        controller: function($scope, $modalInstance) {
          $scope.title = 'Open from node';
          $scope.action = 'Open';
          $scope.host = '127.0.0.1';
          $scope.port = 9000;
          $scope.path = '/';

          $modalInstance.rendered.then(function() {
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
                $modalInstance.close();
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

      $modal.open({
        templateUrl: 'scripts/components/util/host-port-path.modal.html',
        size: 'md',
        controller: function($scope, $modalInstance, kWs) {
          $scope.title = 'Merge from node';
          $scope.action = 'Merge';
          $scope.host = '127.0.0.1';
          $scope.port = 9000;
          $scope.path = '/';

          $modalInstance.rendered.then(function() {
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
                $modalInstance.close();
              }
            });
          };

          $scope.closeError = function() {
            $scope.error = null;
          };
        }
      });
    };

    $scope.disconnectSync = function() {
      if (syncWS) {
        syncWS.close();
        $timeout(function() {
          $scope.synced = false;
        });
      }
    };

    $scope.connectSync = function(evt) {
      evt.preventDefault();
      if (!$scope.synced) {
        var parentScope = $scope;
        $modal.open({
          templateUrl: 'scripts/components/util/host-port-path.modal.html',
          size: 'md',
          controller: function($scope, $modalInstance) {
            $scope.title = 'Connect sync';
            $scope.action = 'Sync';
            $scope.host = '127.0.0.1';
            $scope.port = 9000;
            $scope.path = '/';

            $modalInstance.rendered.then(function() {
              $timeout(function() {
                angular.element('#host').focus();
              }, 250);
            });

            $scope.confirm = function() {
              $scope.closeError();

              if (!$scope.path) {
                $scope.path = '';
              } else {
                if ($scope.path.length === 1 && $scope.path === '/') {
                  $scope.path = '';
                } else if ($scope.path.substr(0, 1) !== '/') {
                  $scope.path = '/' + $scope.path;
                }
              }

              syncWS = new WebSocket('ws://' + $scope.host + ':' + $scope.port + $scope.path);

              syncWS.addEventListener('open', function() {
                $timeout(function() {
                  parentScope.url = $scope.host + (($scope.port === 80) ? '' : ':' + $scope.port) + $scope.path;
                  parentScope.synced = true;
                });
                $modalInstance.close();
                Notification.success({
                  title: $scope.title,
                  message: 'Connected to <strong>ws://' + $scope.host + ':' + $scope.port + $scope.path + '</strong>'
                });
              });

              syncWS.addEventListener('message', function(evt) {
                var data = evt.data;
                if (data.substr(0, 'push/'.length) === 'push/') {
                  data = data.substr('push/'.length);
                }

                var loader = kFactory.createJSONLoader();
                try {
                  var model = loader.loadModelFromString(data).get(0);
                  kEditor.setModel(model);
                  Notification.success({
                    title: $scope.title,
                    message: 'Model updated from sync with <strong>ws://' + $scope.host + ':' + $scope.port + $scope.path + '</strong>'
                  });
                } catch (err) {
                  Notification.error({
                    title: $scope.title,
                    message: 'Error: unable to load received message as a Kevoree JSON model'
                  });
                }
              });

              syncWS.addEventListener('error', function() {
                Notification.error({
                  title: $scope.title,
                  message: 'Error: unable to sync with <strong>ws://' + $scope.host + ':' + $scope.port + $scope.path + '</strong>'
                });
              });

              syncWS.addEventListener('close', function() {
                $timeout(function() {
                  parentScope.synced = false;
                });
                Notification.warning({
                  title: $scope.title,
                  message: 'Connection with <strong>ws://' + $scope.host + ':' + $scope.port + $scope.path + '</strong> closed'
                });
              });
            };

            $scope.closeError = function() {
              $scope.error = null;
            };
          }
        });
      } else {
        Notification.warning({
          title: 'Connect sync',
          message: 'You are already synced'
        });
      }
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
        Notification.error({
          title: 'Save',
          message: 'Unable to serialize model to JSON'
        });
      }
    };

    // copy/paste logic
    var clipboard = [];
    $scope.copy = function () {
        clipboard = ui.getSelectedPaths().filter(function (elem) {
            return typeof elem === 'string';
        });
    };
    $scope.paste = function () {
        clipboard.forEach(function (path) {
            var model = kEditor.getModel();
            var instance = model.findByPath(path);
            if (instance) {
                var clone = kModelHelper.clone(instance);
                switch (kModelHelper.getTypeDefinitionType(instance.typeDefinition)) {
                    case 'node':
                        model.addNodes(clone);
                        if (instance.host) {
                            instance.host.addHosts(clone);
                        }
                        break;
                    case 'group':
                        model.addGroups(clone);
                        break;
                    case 'channel':
                        model.addHubs(clone);
                        break;
                    case 'component':
                        instance.eContainer().addComponents(clone);
                        break;
                }
            }
        });
        if (clipboard.length > 0) {
            kEditor.drawModel();
        }
    };

    $scope.fixOverlapping = function(evt) {
      evt.preventDefault();
      kEditor.fixOverlapping();
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
    };

    $scope.deleteSelected = function(evt) {
      evt.preventDefault();
      var deletions = ui.deleteSelected();
      if (deletions === 0) {
        Notification.warning({
          title: 'Delete selected',
          message: 'Nothing selected'
        });
      }
    };

    $scope.toggleShortcutHelp = function() {
      hotkeys.toggleCheatSheet();
    };

    //$scope.undo = function (evt) {
    //    evt.preventDefault();
    //    console.log('undo');
    //    Notification.warning({
    //        title: 'Undo',
    //        message: 'Not implemented yet',
    //        delay: 3000
    //    });
    //};
    //$scope.redo = function (evt) {
    //    evt.preventDefault();
    //    console.log('redo');
    //    Notification.warning({
    //        title: 'Redo',
    //        message: 'Not implemented yet',
    //        delay: 3000
    //    });
    //};

    hotkeys.bindTo($scope).add({
      combo: 'ctrl+o',
      description: 'Open a model from a file',
      callback: $scope.open
    });

    hotkeys.bindTo($scope).add({
      combo: 'ctrl+m',
      description: 'Merge a model from a file with current model in editor',
      callback: $scope.merge
    });

    hotkeys.bindTo($scope).add({
      combo: 'ctrl+shift+o',
      description: 'Open a model from a node',
      callback: $scope.openFromNode
    });

    hotkeys.bindTo($scope).add({
      combo: 'ctrl+shift+m',
      description: 'Merge a model from a node with current model in editor',
      callback: $scope.mergeFromNode
    });

    hotkeys.bindTo($scope).add({
      combo: 'ctrl+shift+g',
      description: 'Connect to a Web Socket server and stay synced with it',
      callback: $scope.connectSync
    });

    hotkeys.bindTo($scope).add({
      combo: 'ctrl+s',
      description: 'Save the current model into a JSON file',
      callback: function(evt) {
        evt.preventDefault();
        var saveFile = $scope.save;
        $modal
          .open({
            templateUrl: 'scripts/components/util/filename.modal.html',
            size: 'sm',
            controller: function($scope, $modalInstance) {
              $scope.title = 'Save model';
              $scope.body = 'Would you like to save your current model to a file?';
              $scope.filename = 'model' + (Math.floor(Math.random() * (1000 - 100)) + 100);
              $modalInstance.rendered.then(function() {
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
                $modalInstance.close();
              };
            }
          });
      }
    });

    hotkeys.bindTo($scope).add({
      combo: 'alt+o',
      description: 'Fix overlapping',
      callback: $scope.fixOverlapping
    });

    hotkeys.bindTo($scope).add({
      combo: 'alt+shift+d',
      description: 'Delete everything in the current model',
      callback: $scope.deleteAll
    });

    hotkeys.bindTo($scope).add({
      combo: 'alt+shift+i',
      description: 'Delete instances in the current model',
      callback: $scope.deleteInstances
    });

    hotkeys.bindTo($scope).add({
      combo: 'del',
      description: 'Delete selected instances in the current model',
      callback: $scope.deleteSelected
    });

    hotkeys.bindTo($scope).add({
      combo: 'ctrl+a',
      description: 'Select all instances',
      callback: function(evt) {
        evt.preventDefault();
        ui.selectAll();
      }
    });

    hotkeys.bindTo($scope).add({
        combo: 'ctrl+c',
        description: 'Copy the selected instance(s)',
        callback: $scope.copy
    });

    hotkeys.bindTo($scope).add({
        combo: 'ctrl+v',
        description: 'Paste the selected instance(s)',
        callback: $scope.paste
    });

    //hotkeys.bindTo($scope).add({
    //    combo: 'ctrl+z',
    //    description: 'Undo the last modification',
    //    callback: $scope.undo
    //});
    //
    //hotkeys.bindTo($scope).add({
    //    combo: 'ctrl+y',
    //    description: 'Redo the last modification',
    //    callback: $scope.redo
    //});
  });
