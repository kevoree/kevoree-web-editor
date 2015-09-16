'use strict';

angular.module('editorApp')
  .factory('instanceGroupPullHolder', function() {
    return {
      host: '127.0.0.1',
      port: '9000',
      path: '/'
    };
  })
  .controller('InstanceGroupPullCtrl', function($scope, $modalInstance, $timeout, group, kEditor, kWs, instanceGroupPullHolder) {
    $scope.type = 'pull from';
    $scope.action = 'pull';
    $scope.group = group;
    $scope.selectedHost = instanceGroupPullHolder.host;
    $scope.selectedPort = instanceGroupPullHolder.port;
    $scope.selectedPath = instanceGroupPullHolder.path;
    $scope.processing = false;

    $timeout(function() {
      angular.element('#pull').focus();
    }, 250);

    $scope.hosts = {
      '127.0.0.1': 'default'
    };

    $scope.ports = {
      '9000': 'default'
    };

    $scope.paths = {
      '/': 'default'
    };

    $scope.changeHost = function () {
      instanceGroupPullHolder.host = $scope.selectedHost;
    };
    $scope.changePort = function () {
      instanceGroupPullHolder.port = $scope.selectedPort;
    };
    $scope.changePath = function () {
      instanceGroupPullHolder.path = $scope.selectedPath;
    };

    if (group.dictionary) {
      var host = group.dictionary.findValuesByID('host');
      if (host && !$scope.hosts[host.value]) {
        $scope.hosts[host.value] = group.name;
      }

      var port = group.dictionary.findValuesByID('port');
      if (port && !$scope.ports[port.value]) {
        $scope.ports[port.value] = group.name;
      }

      var path = group.dictionary.findValuesByID('path');
      if (path && !$scope.paths[path.value]) {
        $scope.paths[path.value] = group.name;
      }
    }

    group.subNodes.array.forEach(function(node) {
      var fragDic = group.findFragmentDictionaryByID(node.name);

      if (fragDic) {
        var port = fragDic.findValuesByID('port'),
          path = fragDic.findValuesByID('path');

        if (port && !$scope.ports[port.value]) {
          $scope.ports[port.value] = node.name;
        }

        if (path && !$scope.paths[path.value]) {
          $scope.paths[path.value] = node.name;
        }
      }

      node.networkInformation.array.forEach(function(net) {
        net.values.array.forEach(function(val) {
          if (!$scope.hosts[val.value]) {
            $scope.hosts[val.value] = node.name;
          }
        });
      });
    });

    $scope.closeError = function() {
      $scope.error = null;
    };

    $scope.closeSuccess = function() {
      $scope.success = null;
    };

    var ws;
    $scope.confirm = function() {
      $scope.error = null;
      $scope.processing = true;
      ws = kWs.getModel(
        $scope.selectedHost,
        $scope.selectedPort,
        $scope.selectedPath,
        function(err, model) {
          $timeout(function() {
            if (err) {
              $scope.processing = false;
              $scope.error = err.message;
            } else {
              $scope.processing = false;
              $scope.success = true;
              kEditor.setModel(model);
            }
          });
        });
    };

    $scope.close = function() {
      if (ws) {
        ws.close();
      }
      $modalInstance.close();
    };
  });
