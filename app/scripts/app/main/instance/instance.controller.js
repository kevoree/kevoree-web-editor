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
        $scope.netCollapsed = false;
        $scope.fragCollapsed = {};

        $scope.changeVersion = function (index) {
            $scope.instance.typeDefinition = $scope.instance.typeDefinition.eContainer()
                .select('**/typeDefinitions[name='+$scope.instance.typeDefinition.name+',version='+$scope.versions[index]+']').array[0];
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
                                        if (!$scope.instance.findFragmentDictionaryByID(binding.port.eContainer().eContainer().name)) {
                                            var fragDic = kFactory.createFragmentDictionary();
                                            fragDic.name = binding.port.eContainer().eContainer().name;
                                            $scope.instance.addFragmentDictionary(fragDic);
                                        }
                                    }
                                });
                                break;

                            case 'group':
                                $scope.instance.subNodes.array.forEach(function (node) {
                                    if (!$scope.instance.findFragmentDictionaryByID(node.name)) {
                                        var fragDic = kFactory.createFragmentDictionary();
                                        fragDic.name = node.name;
                                        $scope.instance.addFragmentDictionary(fragDic);
                                    }
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

        /**
         * Clean dictionary from unwanted attributes (when a version change occurs, this will strip out
         * values that depend on unknown attributes in the new version)
         * @param dic
         * @param dicType
         * @param isFragment
         */
        function processDictionary(dic, dicType, isFragment) {
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
    });
