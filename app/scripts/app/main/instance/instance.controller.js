'use strict';

/**
 * @ngdoc function
 * @name editorApp.controller:InstanceCtrl
 * @description
 * # InstanceCtrl
 * Controller of the editorApp instance editor
 */
angular.module('editorApp')
  .controller('InstanceCtrl', function ($scope, $timeout, $modal, hotkeys, ui, kEditor, kFactory, kInstance, kModelHelper) {
    var timeout;
    $scope.instance = null;
    $scope.type = null;
    $scope.mainCollapsed = false;
    $scope.dicCollapsed = false;
    $scope.netCollapsed = false;
    $scope.descCollapsed = false;
    $scope.fragCollapsed = {};

    /**
     * Process $scope.instance TypeDefinition in order to set default values on the dictionaries
     **/
    function processTypeDefinition() {
      $scope.versions = $scope.instance.typeDefinition.eContainer()
        .select('typeDefinitions[name=' + $scope.instance.typeDefinition.name + ']').array
        .map(function (tdef) {
          return tdef.version;
        });
      $scope.instance.selectedVersion = $scope.instance.typeDefinition.version;
      var descMeta = $scope.instance.typeDefinition.findMetaDataByID('description');
      if (descMeta) {
        $scope.description = descMeta.value;
      } else {
        $scope.description = '<em>- none -</em>';
      }
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

    $scope.changeName = function (form, name) {
      if (form.name.$valid) {
        $scope.instance.name = name;
      }
    };

    $scope.changeVersion = function (version) {
      if (version) {
        $scope.instance.typeDefinition = $scope.instance.typeDefinition.eContainer()
          .select('**/typeDefinitions[name=' + $scope.instance.typeDefinition.name + ',version=' + version + ']').array[0];
        processDictionary($scope.instance.dictionary, $scope.instance.typeDefinition.dictionaryType, false);
        $scope.instance.fragmentDictionary.array.forEach(function (fragDic) {
          processDictionary(fragDic, $scope.instance.typeDefinition.dictionaryType, true);
        });
        processTypeDefinition();
      }
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
      net.name = 'net' + $scope.instance.networkInformation.size();

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

    $scope.openGroupModal = function () {
      $modal.open({
        templateUrl: 'scripts/app/main/instance/group.modal.html',
        size: 'md',
        resolve: {
          group: function () {
            return $scope.instance;
          }
        },
        controller: 'GroupModalCtrl'
      });
    };

    $scope.isTruish = kModelHelper.isTruish;

    $scope.isReadOnly = function () {
      // TODO put that code in kModelHelper
      if ($scope.instance) {
        var val = $scope.instance.findMetaDataByID('access_mode');
        return val && val.value === 'read-only';
      }
      return false;
    };

    $scope.isVirtual = function () {
      return kModelHelper.isVirtual($scope.instance);
    };

    function processSelection() {
      $timeout(function () {
        // do the process in a timeout to be sure it gets $digested
        $scope.instance = null;
        $scope.type = null;
        $scope.versions = [];
        $scope.description = '<em>- none -</em>';
        $scope.dicAttrs = [];
        $scope.fragDicAttrs = [];
        $scope.processing = true;

        var selection = kModelHelper.getSelection(kEditor.getModel());
        if (selection.length === 1) {
          $scope.instance = selection[0];
          if ($scope.instance) {
            $scope.instance.selectedVersion = $scope.instance.typeDefinition.version;
            angular.element('.ui-notification').css('right', '260px');
            // using preName to prevent user from naming two instances with the same name
            $scope.instance.preName = $scope.instance.name;
            $scope.type = kModelHelper.getTypeDefinitionType($scope.instance.typeDefinition);
            processTypeDefinition();
            $scope.processing = false;
          }
        }
      });
    }

    processSelection();
    var unregister = kEditor.addModelUpdateListener('selected', processSelection, true);
    var unregister2 = kEditor.addNewModelListener('selected', processSelection);

    $scope.$on('$destroy', function () {
      unregister();
      unregister2();
      $timeout.cancel(timeout);
    });
  });
