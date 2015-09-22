'use strict';

angular.module('editorApp')
    .factory('groupModalHolder', function() {
        return {
            host: '127.0.0.1',
            port: '9000',
            path: '/'
        };
    })
    .controller('GroupModalCtrl', function($scope, $modalInstance, $timeout, group, kEditor, kWs, groupModalHolder) {
        $scope.type = 'push to';
        $scope.action = 'push';
        $scope.group = group;
        $scope.selectedHost = groupModalHolder.host;
        $scope.selectedPort = groupModalHolder.port;
        $scope.selectedPath = groupModalHolder.path;
        $scope.processing = false;

        $scope.hosts = {
            '127.0.0.1': 'default'
        };

        $scope.ports = {
            '9000': 'default'
        };

        $scope.paths = {
            '/': 'default'
        };

        $scope.changeHost = function() {
            groupModalHolder.host = $scope.selectedHost;
        };
        $scope.changePort = function() {
            groupModalHolder.port = $scope.selectedPort;
        };
        $scope.changePath = function() {
            groupModalHolder.path = $scope.selectedPath;
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
        $scope.push = function() {
            $scope.action = 'pushed to';
            $scope.error = null;
            $scope.processing = true;
            $timeout(function() {
                ws = kWs.pushModel(
                    kEditor.getModel(),
                    $scope.selectedHost,
                    $scope.selectedPort,
                    $scope.selectedPath,
                    function(err) {
                        $timeout(function() {
                            if (err) {
                                $scope.processing = false;
                                $scope.error = err.message;
                            } else {
                                $scope.processing = false;
                                $scope.success = true;
                            }
                        });
                    });
            });
        };

        $scope.pull = function() {
            $scope.action = 'pulled from';
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
