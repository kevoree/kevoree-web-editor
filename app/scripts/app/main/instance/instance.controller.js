'use strict';

/**
 * @ngdoc function
 * @name editorApp.controller:InstanceCtrl
 * @description
 * # InstanceCtrl
 * Controller of the editorApp instance editor
 */
angular.module('editorApp')
  .controller('InstanceCtrl', function($scope, $timeout, $modal, hotkeys, ui, kEditor, kFactory, kInstance, kModelHelper) {
    $scope.instance = null;
    $scope.instanceName = null;
    $scope.type = null;
    $scope.mainCollapsed = false;
    $scope.dicCollapsed = false;
    $scope.netCollapsed = false;
    $scope.fragCollapsed = {};

    $scope.changeName = function (form, name) {
      if (form.name.$valid) {
        $scope.instance.name = name;
      }
    };

    $scope.changeVersion = function(version) {
      $scope.instance.typeDefinition = $scope.instance.typeDefinition.eContainer()
        .select('**/typeDefinitions[name=' + $scope.instance.typeDefinition.name + ',version=' + version + ']').array[0];
      processDictionary($scope.instance.dictionary, $scope.instance.typeDefinition.dictionaryType, false);
      $scope.instance.fragmentDictionary.array.forEach(function(fragDic) {
        processDictionary(fragDic, $scope.instance.typeDefinition.dictionaryType, true);
      });
      processTypeDefinition();
    };

    $scope.hasFragmentDictionary = function() {
      if ($scope.instance && $scope.instance.fragmentDictionary) {
        return $scope.instance.fragmentDictionary.size() > 0;
      } else {
        return false;
      }
    };

    $scope.hasNetworkInformation = function() {
      return $scope.instance && (typeof($scope.instance.networkInformation) !== 'undefined');
    };

    $scope.manageNetwork = function(evt, net) {
      evt.stopPropagation();
      $modal.open({
        templateUrl: 'scripts/app/main/instance/network.modal.html',
        size: 'md',
        resolve: {
          node: function() {
            return $scope.instance;
          },
          net: function() {
            return net;
          }
        },
        controller: 'InstanceNetworkModalCtrl'
      });
    };

    $scope.addNetwork = function() {
      var net = kFactory.createNetworkInfo();
      net.name = 'net' + $scope.instance.networkInformation.size();

      $modal.open({
        templateUrl: 'scripts/app/main/instance/network.modal.html',
        size: 'md',
        resolve: {
          node: function() {
            return $scope.instance;
          },
          net: function() {
            return net;
          }
        },
        controller: 'InstanceNetworkModalCtrl'
      });
    };

    $scope.push = function() {
      $modal.open({
        templateUrl: 'scripts/app/main/instance/group.modal.html',
        size: 'md',
        resolve: {
          group: function() {
            return $scope.instance;
          }
        },
        controller: 'InstanceGroupPushCtrl'
      });
    };

    $scope.pull = function() {
      $modal.open({
        templateUrl: 'scripts/app/main/instance/group.modal.html',
        size: 'md',
        resolve: {
          group: function() {
            return $scope.instance;
          }
        },
        controller: 'InstanceGroupPullCtrl'
      });
    };

    $scope.isTruish = kModelHelper.isTruish;

    var timeout;
    ui.setSelectedListener(function(path) {
      $timeout(function() {
        if ($scope.instance && ($scope.instance.path() !== path)) {
          // reset values
          $scope.instance = null;
          $scope.instanceName = null;
          $scope.type = null;
          $scope.selectedVersion = null;
          $scope.versions = [];
          $scope.dicAttrs = [];
          $scope.fragDicAttrs = [];
          $scope.processing = true;
        }
      }).then(function() {
        $timeout.cancel(timeout);
        if (path) {
          $scope.instance = kEditor.getModel().findByPath(path);
          if ($scope.instance && $scope.instance.getRefInParent() !== 'mBindings') {
            $scope.instanceName = $scope.instance.name;
            $scope.type = kModelHelper.getTypeDefinitionType($scope.instance.typeDefinition);
            timeout = $timeout(function() {
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
        .select('typeDefinitions[name=' + $scope.instance.typeDefinition.name + ']').array
        .map(function(tdef) {
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
        dic.values.array.forEach(function(val) {
          var attr = dicType.select('attributes[name=' + val.name + ']').array[0];
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

    hotkeys.add({
      combo: 'ctrl+shift+p',
      description: 'Push model using the currently selected group',
      callback: function (event) {
        if ($scope.instance && $scope.type === 'group') {
          event.preventDefault();
          $scope.push();
        }
      }
    });

    hotkeys.add({
      combo: 'ctrl+shift+l',
      description: 'Pull model using the currently selected group',
      callback: function (event) {
        if ($scope.instance && $scope.type === 'group') {
          event.preventDefault();
          $scope.pull();
        }
      }
    });
  });
