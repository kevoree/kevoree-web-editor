'use strict';

/**
 * @ngdoc function
 * @name editorApp.controller:LibrariesCtrl
 * @description
 * # LibrariesCtrl
 * Controller of the editorApp registry libraries page
 */
angular.module('editorApp')
    .controller('LibrariesCtrl', function ($scope, $timeout, $stateParams, kRegistry, kModelHelper, kFactory, Notification, KEVOREE_REGISTRY_URL) {
        Notification.config({ top: 65 });

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
            $scope.selectedTdef = tdef;

            if (!$scope.selectedTdef.release) {
                var pkgPath = '/packages[';
                $scope.selectedTdef.package.split('.').forEach(function (name, i, array) {
                    pkgPath += name+']';
                    if (i < array.length - 1) {
                        pkgPath += '/packages[';
                    }
                });
                var tdefs = $scope.model.select(pkgPath+'/typeDefinitions[name='+$scope.selectedTdef.name+']');
                var release = kModelHelper.getLatestRelease(tdefs.array);
                var snapshot = kModelHelper.getLatestSnapshot(tdefs.array);

                $scope.selectedTdef.release = release ? release.version : '-';
                $scope.selectedTdef.snapshot = snapshot ? snapshot.version : '-';

                if (release) {
                    $scope.selectedTdef.platforms = kModelHelper.getPlatforms(release);
                } else {
                    $scope.selectedTdef.platforms = kModelHelper.getPlatforms(snapshot);
                }

                $scope.selectedTdef.versions = [];
                tdefs.array.forEach(function (tdef) {
                    if ($scope.selectedTdef.versions.indexOf(tdef.version) === -1) {
                        $scope.selectedTdef.versions.push(tdef.version);
                    }
                });
            }
        };

        $scope.semverOrder = function () {
            console.log('orderBy', arguments);
        };

        $scope.merge = function () {
            console.log('TODO');
        };

        $scope.closeError = function () {
            $scope.error = null;
        };
    });