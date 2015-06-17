'use strict';

/**
 * @ngdoc function
 * @name editorApp.controller:InstanceCtrl
 * @description
 * # InstanceCtrl
 * Controller of the editorApp instance editor
 */
angular.module('editorApp')
    .controller('InstanceCtrl', function ($scope, $timeout, $modal, ui, kEditor, kFactory, kInstance, kModelHelper) {
        $scope.instance = null;
        $scope.type = null;
        $scope.mainCollapsed = false;
        $scope.dicCollapsed = false;
        $scope.netCollapsed = false;
        $scope.fragCollapsed = {};

        $scope.changeVersion = function (version) {
            $scope.instance.typeDefinition = $scope.instance.typeDefinition.eContainer()
                .select('**/typeDefinitions[name='+$scope.instance.typeDefinition.name+',version='+version+']').array[0];
            processDictionary($scope.instance.dictionary, $scope.instance.typeDefinition.dictionaryType, false);
            $scope.instance.fragmentDictionary.array.forEach(function (fragDic) {
                processDictionary(fragDic, $scope.instance.typeDefinition.dictionaryType, true);
            });
            processTypeDefinition();
        };

        $scope.hasFragmentDictionary = function () {
            if ($scope.instance && $scope.instance.fragmentDictionary) {
                return $scope.instance.fragmentDictionary.size() > 0;
            } else {
                return false;
            }
        };

        $scope.hasNetworkInformation = function () {
            return $scope.instance && (typeof ($scope.instance.networkInformation) !== 'undefined');
        };

        $scope.manageNetwork = function (evt, net) {
            evt.stopPropagation();
            $modal.open({
                templateUrl: 'scripts/app/main/instance/network.modal.html',
                size: 'md',
                resolve: {
                    node: function () {
                        return $scope.instance;
                    },
                    net: function () {
                        return net;
                    }
                },
                controller: 'InstanceNetworkModalCtrl'
            });
        };

        $scope.addNetwork = function () {
            var net = kFactory.createNetworkInfo();
            net.name = 'net'+$scope.instance.networkInformation.size();

            $modal.open({
                templateUrl: 'scripts/app/main/instance/network.modal.html',
                size: 'md',
                resolve: {
                    node: function () {
                        return $scope.instance;
                    },
                    net: function () {
                        return net;
                    }
                },
                controller: 'InstanceNetworkModalCtrl'
            });
        };

        $scope.push = function () {
            $modal.open({
                templateUrl: 'scripts/app/main/instance/group.modal.html',
                size: 'md',
                resolve: {
                    group: function () {
                        return $scope.instance;
                    }
                },
                controller: function ($scope, $modalInstance, group, kWs) {
                    $scope.type = 'push to';
                    $scope.action = 'push';
                    $scope.group = group;
                    $scope.selectedHost = '127.0.0.1';
                    $scope.selectedPort = '9000';
                    $scope.selectedPath = '/';
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

                    group.subNodes.array.forEach(function (node) {
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

                        node.networkInformation.array.forEach(function (net) {
                            net.values.array.forEach(function (val) {
                                if (!$scope.hosts[val.value]) {
                                    $scope.hosts[val.value] = node.name;
                                }
                            });
                        });
                    });

                    $scope.closeError = function () {
                        $scope.error = null;
                    };

                    $scope.closeSuccess = function () {
                        $scope.success = null;
                    };

                    var ws;
                    $scope.confirm = function () {
                        $scope.error = null;
                        $scope.processing = true;
                        $timeout(function () {
                            ws = kWs.pushModel(
                                kEditor.getModel(),
                                $scope.selectedHost,
                                $scope.selectedPort,
                                $scope.selectedPath,
                                function (err) {
                                    $timeout(function () {
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

                    $scope.close = function () {
                        if (ws) {
                            ws.close();
                        }
                        $modalInstance.close();
                    };
                }
            });
        };

        $scope.pull = function () {
            $modal.open({
                templateUrl: 'scripts/app/main/instance/group.modal.html',
                size: 'md',
                resolve: {
                    group: function () {
                        return $scope.instance;
                    }
                },
                controller: function ($scope, $modalInstance, group, kWs) {
                    $scope.type = 'pull from';
                    $scope.action = 'pull';
                    $scope.group = group;
                    $scope.selectedHost = '127.0.0.1';
                    $scope.selectedPort = '9000';
                    $scope.selectedPath = '/';
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

                    group.subNodes.array.forEach(function (node) {
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

                        node.networkInformation.array.forEach(function (net) {
                            net.values.array.forEach(function (val) {
                                if (!$scope.hosts[val.value]) {
                                    $scope.hosts[val.value] = node.name;
                                }
                            });
                        });
                    });

                    $scope.closeError = function () {
                        $scope.error = null;
                    };

                    $scope.closeSuccess = function () {
                        $scope.success = null;
                    };

                    var ws;
                    $scope.confirm = function () {
                        $scope.error = null;
                        $scope.processing = true;
                        ws = kWs.getModel(
                            $scope.selectedHost,
                            $scope.selectedPort,
                            $scope.selectedPath,
                            function (err) {
                                $timeout(function () {
                                    if (err) {
                                        $scope.processing = false;
                                        $scope.error = err.message;
                                    } else {
                                        $scope.processing = false;
                                        $scope.success = true;
                                    }
                                });
                            });
                    };

                    $scope.close = function () {
                        if (ws) {
                            ws.close();
                        }
                        $modalInstance.close();
                    };
                }
            });
        };

        $scope.isTruish = kModelHelper.isTruish;

        var timeout;
        ui.setSelectedListener(function (path) {
            $timeout(function () {
                if ($scope.instance && ($scope.instance.path() !== path)) {
                    // reset values
                    $scope.instance = null;
                    $scope.type = null;
                    $scope.selectedVersion = null;
                    $scope.versions = [];
                    $scope.dicAttrs = [];
                    $scope.fragDicAttrs = [];
                    $scope.processing = true;
                }
            }).then(function () {
                $timeout.cancel(timeout);
                if (path) {
                    $scope.instance = kEditor.getModel().findByPath(path);
                    if ($scope.instance && $scope.instance.getRefInParent() !== 'mBindings') {
                        $scope.type = kModelHelper.getTypeDefinitionType($scope.instance.typeDefinition);
                        timeout = $timeout(function () {
                            processTypeDefinition();
                            $scope.processing = false;
                        });
                    } else {
                        // do not display mBindings
                        $scope.instance = null;
                    }
                }
            });
        });

        /**
         * Process $scope.instance TypeDefinition in order to set default values on the dictionaries
         **/
        function processTypeDefinition() {
            $scope.versions = $scope.instance.typeDefinition.eContainer()
                .select('typeDefinitions[name='+$scope.instance.typeDefinition.name+']').array
                .map(function (tdef) {
                    return tdef.version;
                });
            $scope.selectedVersion = $scope.instance.typeDefinition.version;
            if ($scope.instance.typeDefinition.dictionaryType) {
                $scope.dicAttrs = $scope.instance.typeDefinition.dictionaryType
                    .select('attributes[fragmentDependant=false]').array;
                $scope.fragDicAttrs = $scope.instance.typeDefinition.dictionaryType
                    .select('attributes[fragmentDependant=true]').array;
            } else {
                $scope.dicAttrs = [];
                $scope.fragDicAttrs = [];
            }

            // create dictionary values if none set
            kInstance.initDictionaries($scope.instance);
        }

        /**
         * Clean dictionary from unwanted attributes (when a version change occurs, this will strip out
         * values that depend on unknown attributes in the new version)
         * @param dic
         * @param dicType
         * @param isFragment
         */
        function processDictionary(dic, dicType, isFragment) {
            if (dicType) {
                dic.values.array.forEach(function (val) {
                    var attr = dicType.select('attributes[name='+val.name+']').array[0];
                    if (attr) {
                        if ($scope.isTruish(attr.fragmentDependant)) {
                            if (!isFragment) {
                                val.delete();
                            }
                        } else {
                            if (isFragment) {
                                val.delete();
                            }
                        }
                    } else {
                        val.delete();
                    }
                });
            }
        }
    });
