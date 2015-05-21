'use strict';

/**
 * @ngdoc function
 * @name editorApp.controller:InstanceCtrl
 * @description
 * # InstanceCtrl
 * Controller of the editorApp instance editor
 */
angular.module('editorApp')
    .controller('InstanceCtrl', function ($scope, $timeout, uiFactory, kEditor, kFactory, kModelHelper) {
        $scope.instance = null;
        $scope.type = null;
        $scope.grpCollapsed = false;
        $scope.dicCollapsed = false;
        $scope.fragCollapsed = {};

        $scope.changeVersion = function (index) {
            $scope.instance.typeDefinition = $scope.instance.typeDefinition.eContainer()
                .select('**/typeDefinitions[name='+$scope.instance.typeDefinition.name+',version='+$scope.versions[index]+']').array[0];
        };

        $scope.hasFragmentDictionary = function () {
            if ($scope.instance && $scope.instance.fragmentDictionary) {
                return $scope.instance.fragmentDictionary.size() > 0;
            } else {
                return false;
            }
        };

        uiFactory.setSelectedListener(function (path) {
            $timeout(function () {
                if (path) {
                    $scope.instance = kEditor.getModel().findByPath(path);
                    $scope.type = kModelHelper.getTypeDefinitionType($scope.instance.typeDefinition);
                    $scope.versions = $scope.instance.typeDefinition.eContainer()
                        .select('**/typeDefinitions[name='+$scope.instance.typeDefinition.name+']').array
                        .map(function (tdef) {
                            return tdef.version;
                        });
                    $scope.selectedVersion = $scope.versions.indexOf($scope.instance.typeDefinition.version);

                    // create dictionary values if none set
                    $scope.instance.dictionary = $scope.instance.dictionary || kFactory.createDictionary();
                    $scope.instance.typeDefinition.dictionaryType.attributes.array.forEach(function (attr) {
                        var val = $scope.instance.dictionary.findValuesByID(attr.name);
                        if (!val) {
                            if (!attr.fragmentDependant) {
                                // add the default value to the dictionary
                                val = kFactory.createValue();
                                val.name = attr.name;
                                val.value = attr.defaultValue;
                                $scope.instance.dictionary.addValues(val);
                            } else {
                                // add the default value to the fragment dictionary if any

                            }
                        }
                    });

                } else {
                    $scope.instance = null;
                }
            });
        });
    });
