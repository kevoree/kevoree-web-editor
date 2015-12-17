'use strict';

/**
 * @ngdoc function
 * @name editorApp.controller:LibrariesCtrl
 * @description
 * # LibrariesCtrl
 * Controller of the editorApp registry libraries page
 */
angular.module('editorApp')
    .controller('LibrariesCtrl', function ($scope, $timeout, kRegistry, kModelHelper, kFactory, kEditor) {
        $scope.loading = true;

        kRegistry
            .init()
            .then(function (tdefs) {
                $scope.tdefs = tdefs;
                $timeout(function () {
                    angular.element('#filter-by-tdef').focus();
                });
            })
            .catch(function (err) {
                $scope.error = err.message;
            })
            .finally(function () {
                $scope.loading = false;
            });

        $scope.select = function (evt, tdef) {
            evt.preventDefault();

            if (!evt.ctrlKey) {
                $scope.tdefs.getAll().forEach(function (item) {
                    item.selected = false;
                });
            }

            tdef.selected = !tdef.selected;
            tdef.uiOpen = tdef.selected;
        };

        $scope.changeVersion = function () {
            $scope.closeError();
        };

        $scope.merge = function (tdef) {
            kRegistry.get(kModelHelper.fqnToPath(tdef.package)+'/typeDefinitions[name='+tdef.name+',version='+tdef.version+']')
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

        $scope.mergeAll = function () {
            $scope.tdefs.getAll()
                .forEach(function (item) {
                    if (item.selected && item.version) {
                        $scope.merge(item);
                    }
                });
        };

        $scope.isMergeable = function (tdef) {
            var mergeable = false;

            if (tdef.version) {
                mergeable = !kEditor.getModel().findByPath(kModelHelper.pkgFqnToPath(tdef.package)+'/typeDefinitions[name='+tdef.name+',version='+tdef.version+']');
            }

            return mergeable;
        };

        $scope.areMergeable = function () {
            var tdefs = $scope.tdefs.getAll();

            for (var i=0; i < tdefs.length; i++) {
                if (tdefs[i].selected && tdefs[i].version) {
                    if ($scope.isMergeable(tdefs[i])) {
                        return true;
                    }
                }
            }

            return false;
        };

        $scope.closeError = function () {
            $scope.error = null;
        };

        function beforeUnload() {
            kRegistry.save();
        }

        window.addEventListener('beforeunload', beforeUnload);

        $scope.$on('$destroy', function () {
            window.removeEventListener('beforeunload', beforeUnload);
        });
    });
