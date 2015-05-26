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
        $scope.mainCollapsed = false;
        $scope.dicCollapsed = false;
        $scope.fragCollapsed = {};

        $scope.changeVersion = function (index) {
            $scope.instance.typeDefinition = $scope.instance.typeDefinition.eContainer()
                .select('**/typeDefinitions[name='+$scope.instance.typeDefinition.name+',version='+$scope.versions[index]+']').array[0];
            var oldDic = $scope.instance.dictionary;
            $scope.instance.dictionary = kFactory.createDictionary();
            $scope.instance.typeDefinition.dictionaryType.attributes.array.forEach(function (attr) {
                var oldVal, newVal;
                if (!$scope.isTruish(attr.fragmentDependant)) {
                    // attribute is not fragment dependant
                    oldVal = oldDic.findValuesByID(attr.name);
                    if (oldVal) {
                        // set the old value in the new dictionary
                        newVal = kFactory.createValue();
                        newVal.name = attr.name;
                        newVal.value = oldVal.value;
                        $scope.instance.dictionary.addValues(newVal);
                    }
                }
                // TODO should I also put back old values from fragment dictionaries too ?
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

        $scope.isTruish = function (val) {
            return (val === 'true' || val > 0 || val === true);
        };

        uiFactory.setSelectedListener(function (path) {
            $timeout(function () {
                if (path) {
                    $scope.instance = kEditor.getModel().findByPath(path);
                    if ($scope.instance) {
                        $scope.type = kModelHelper.getTypeDefinitionType($scope.instance.typeDefinition);
                        processTypeDefinition();
                    }

                } else {
                    $scope.instance = null;
                }
            });
        });

        /**
         * Process $scope.instance TypeDefinition in order to set default values on the dictionaries
         **/
        function processTypeDefinition() {
            $scope.versions = $scope.instance.typeDefinition.eContainer()
                .select('**/typeDefinitions[name='+$scope.instance.typeDefinition.name+']').array
                .map(function (tdef) {
                    return tdef.version;
                });
            $scope.selectedVersion = $scope.versions.indexOf($scope.instance.typeDefinition.version)+'';
            $scope.dicAttrs = $scope.instance.typeDefinition.dictionaryType
                .select('attributes[fragmentDependant=false]').array;
            $scope.fragDicAttrs = $scope.instance.typeDefinition.dictionaryType
                .select('attributes[fragmentDependant=true]').array;

            // create dictionary values if none set
            $scope.instance.dictionary = $scope.instance.dictionary || kFactory.createDictionary();
            $scope.instance.typeDefinition.dictionaryType.attributes
                .array.forEach(function (attr) {
                    var val;
                    if (!$scope.isTruish(attr.fragmentDependant)) {
                        // attribute is not fragment dependant
                        val = $scope.instance.dictionary.findValuesByID(attr.name);
                        if (!val) {
                            val = kFactory.createValue();
                            val.name = attr.name;
                            val.value = attr.defaultValue;
                            $scope.instance.dictionary.addValues(val);
                        }
                    } else {
                        // attribute is fragment dependant
                        // create fragment dictionaries if needed
                        switch (kModelHelper.getTypeDefinitionType($scope.instance.typeDefinition)) {
                            case 'channel':
                                $scope.instance.bindings.array.forEach(function (binding) {
                                    if (binding.port) {
                                        var fragDic = kFactory.createFragmentDictionary();
                                        fragDic.name = binding.port.eContainer().eContainer().name;
                                        $scope.instance.addFragmentDictionary(fragDic);
                                    }
                                });
                                break;

                            case 'group':
                                $scope.instance.subNodes.array.forEach(function (node) {
                                    var fragDic = kFactory.createFragmentDictionary();
                                    fragDic.name = node.name;
                                    $scope.instance.addFragmentDictionary(fragDic);
                                });
                                break;
                        }
                        // add default value to fragment dictionaries that does not already have them
                        $scope.instance.fragmentDictionary.array.forEach(function (fragDic) {
                            val = fragDic.findValuesByID(attr.name);
                            if (!val) {
                                val = kFactory.createValue();
                                val.name = attr.name;
                                val.value = attr.defaultValue;
                                fragDic.addValues(val);
                            }
                        });
                    }
                });
        }
    });
