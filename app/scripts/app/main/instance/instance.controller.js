'use strict';

/**
 * @ngdoc function
 * @name editorApp.controller:InstanceCtrl
 * @description
 * # InstanceCtrl
 * Controller of the editorApp instance editor
 */
angular.module('editorApp')
    .controller('InstanceCtrl', function ($scope, $timeout, uiFactory, kEditor, kFactory, kInstance, kModelHelper) {
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

        $scope.addNetwork = function () {
            var net = kFactory.createNetworkInfo();
            net.name = 'ip';
            var val = kFactory.createValue();
            val.name = 'lo';
            val.value = '127.0.0.1';
            net.addValues(val);
            $scope.instance.addNetworkInformation(net);
        };

        $scope.isTruish = kModelHelper.isTruish;

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
