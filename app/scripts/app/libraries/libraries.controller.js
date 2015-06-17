'use strict';

/**
 * @ngdoc function
 * @name editorApp.controller:LibrariesCtrl
 * @description
 * # LibrariesCtrl
 * Controller of the editorApp registry libraries page
 */
angular.module('editorApp')
    .controller('LibrariesCtrl', function ($scope, $timeout, $stateParams, kRegistry, kModelHelper, kFactory, kEditor, KEVOREE_REGISTRY_URL) {
        $scope.KEVOREE_REGISTRY_URL = KEVOREE_REGISTRY_URL;
        $scope.loading = true;
        $scope.selectedTdef = null;

        kRegistry
            .getRoot()
            .then(function (model) {
                $scope.model = model;
                $scope.groups = {};
                $scope.nodes = {};
                $scope.comps = {};
                $scope.chans = {};
                model.select('**/typeDefinitions[*]').array.forEach(function (tdef) {
                    var pkgFqn = kModelHelper.genPkgName(tdef.eContainer());

                    switch (kModelHelper.getTypeDefinitionType(tdef)) {
                        case 'group':
                            $scope.groups[pkgFqn+'_'+tdef.name] = null;
                            break;

                        case 'node':
                            $scope.nodes[pkgFqn+'_'+tdef.name] = null;
                            break;

                        case 'component':
                            $scope.comps[pkgFqn+'_'+tdef.name] = null;
                            break;

                        case 'channel':
                            $scope.chans[pkgFqn+'_'+tdef.name] = null;
                            break;
                    }
                });

                $scope.groups = Object.keys($scope.groups).map(function (key) {
                    var split = key.split('_');
                    return { 'package': split[0], name: split[1] };
                });
                $scope.nodes = Object.keys($scope.nodes).map(function (key) {
                    var split = key.split('_');
                    return { 'package': split[0], name: split[1] };
                });
                $scope.comps = Object.keys($scope.comps).map(function (key) {
                    var split = key.split('_');
                    return { 'package': split[0], name: split[1] };
                });
                $scope.chans = Object.keys($scope.chans).map(function (key) {
                    var split = key.split('_');
                    return { 'package': split[0], name: split[1] };
                });
            })
            .catch(function (err) {
                $scope.error = err.message;
            })
            .finally(function () {
                $scope.loading = false;
            });

        $scope.select = function (tdef) {
            $scope.success = false;
            $scope.selectedTdef = tdef;

            if (!$scope.selectedTdef.release) {
                var pkgPath = '/packages[';
                $scope.selectedTdef.package.split('.').forEach(function (name, i, array) {
                    pkgPath += name+']';
                    if (i < array.length - 1) {
                        pkgPath += '/packages[';
                    }
                });
                $scope.selectedTdef.pkgPath = pkgPath;
                var tdefs = $scope.model.select(pkgPath+'/typeDefinitions[name='+$scope.selectedTdef.name+']');
                var release = kModelHelper.getLatestRelease(tdefs.array);
                var snapshot = kModelHelper.getLatestSnapshot(tdefs.array);

                $scope.selectedTdef.release = release ? release.version : null;
                $scope.selectedTdef.snapshot = snapshot ? snapshot.version : null;

                if ($scope.selectedTdef.release) {
                    $scope.selectedTdef.version = release.version;
                } else if ($scope.selectedTdef.snapshot) {
                    $scope.selectedTdef.version = snapshot.version;
                } else {
                    $scope.selectedTdef.version = null;
                }

                if (release) {
                    $scope.selectedTdef.platforms = kModelHelper.getPlatforms(release);

                } else if (snapshot) {
                    $scope.selectedTdef.platforms = kModelHelper.getPlatforms(snapshot);
                } else {
                    $scope.selectedTdef.platforms = [];
                }

                $scope.selectedTdef.versions = [];
                tdefs.array.forEach(function (tdef) {
                    if ($scope.selectedTdef.versions.indexOf(tdef.version) === -1) {
                        $scope.selectedTdef.versions.push(tdef.version);
                    }
                });
            }
        };

        $scope.changeVersion = function () {
            $scope.success = false;
            $scope.closeError();
        };

        $scope.merge = function () {
            kRegistry.get($scope.selectedTdef.pkgPath+'/typeDefinitions[name='+$scope.selectedTdef.name+',version='+$scope.selectedTdef.version+']')
                .then(function (tdefModel) {
                    try {
                        kEditor.merge(tdefModel);
                        $scope.success = true;
                    } catch (err) {
                        $scope.error = err.message;
                    }
                })
                .catch(function (err) {
                    $scope.error = err.message;
                });
        };

        $scope.isMergeable = function () {
            var mergeable = false;

            if ($scope.selectedTdef.version) {
                mergeable = !kEditor.getModel().findByPath($scope.selectedTdef.pkgPath+'/typeDefinitions[name='+$scope.selectedTdef.name+',version='+$scope.selectedTdef.version+']');
            }

            return mergeable;
        };

        $scope.closeError = function () {
            $scope.error = null;
        };
    });