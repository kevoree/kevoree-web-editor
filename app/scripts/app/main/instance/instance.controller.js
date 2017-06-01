'use strict';

/**
 * @ngdoc function
 * @name editorApp.controller:InstanceCtrl
 * @description
 * # InstanceCtrl
 * Controller of the editorApp instance editor
 */
angular.module('editorApp')
  .controller('InstanceCtrl', function ($scope, $timeout, $uibModal, hotkeys, ui, kEditor, kFactory, kInstance, kModelHelper) {
    var vm = this;

    var timeout;
    vm.instance = null;
    vm.type = null;
    vm.mainCollapsed = false;
    vm.dicCollapsed = false;
    vm.netCollapsed = false;
    vm.descCollapsed = false;
    vm.fragCollapsed = {};

    /**
     * Process vm.instance TypeDefinition in order to set default values on the dictionaries
     **/
    function processTypeDefinition() {
      vm.versions = vm.instance.typeDefinition.eContainer()
        .select('typeDefinitions[name=' + vm.instance.typeDefinition.name + ']').array
        .map(function (tdef) {
          return tdef.version;
        });
      vm.instance.selectedVersion = vm.instance.typeDefinition.version;
      vm.dus = vm.instance.typeDefinition.deployUnits.array;
      var descMeta = vm.instance.typeDefinition.findMetaDataByID('description');
      if (descMeta) {
        vm.description = descMeta.value;
      } else {
        vm.description = '<em>- none -</em>';
      }
      if (vm.instance.typeDefinition.dictionaryType) {
        vm.dicAttrs = vm.instance.typeDefinition.dictionaryType
          .select('attributes[fragmentDependant=false]').array;
        vm.fragDicAttrs = vm.instance.typeDefinition.dictionaryType
          .select('attributes[fragmentDependant=true]').array;
      } else {
        vm.dicAttrs = [];
        vm.fragDicAttrs = [];
      }

      // create dictionary values if none set
      kInstance.initDictionaries(vm.instance);
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
            if (vm.isTruish(attr.fragmentDependant)) {
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

    vm.changeName = function (form, name) {
      if (form.name.$valid) {
        vm.instance.name = name;
      }
    };

    vm.changeVersion = function (version) {
      if (version) {
        vm.instance.typeDefinition = vm.instance.typeDefinition.eContainer()
          .select('**/typeDefinitions[name=' + vm.instance.typeDefinition.name + ',version=' + version + ']').array[0];
        processDictionary(vm.instance.dictionary, vm.instance.typeDefinition.dictionaryType, false);
        vm.instance.fragmentDictionary.array.forEach(function (fragDic) {
          processDictionary(fragDic, vm.instance.typeDefinition.dictionaryType, true);
        });
        processTypeDefinition();
      }
    };

    vm.hasFragmentDictionary = function () {
      if (vm.instance && vm.instance.fragmentDictionary) {
        return vm.instance.fragmentDictionary.size() > 0;
      } else {
        return false;
      }
    };

    vm.hasNetworkInformation = function () {
      return vm.instance && (typeof (vm.instance.networkInformation) !== 'undefined');
    };

    vm.manageNetwork = function (evt, net) {
      evt.stopPropagation();
      $uibModal.open({
        templateUrl: 'scripts/app/main/instance/network.modal.html',
        size: 'md',
        resolve: {
          node: function () {
            return vm.instance;
          },
          net: function () {
            return net;
          }
        },
        controller: 'InstanceNetworkModalCtrl'
      });
    };

    vm.addNetwork = function () {
      var net = kFactory.createNetworkInfo();
      net.name = 'net' + vm.instance.networkInformation.size();

      $uibModal.open({
        templateUrl: 'scripts/app/main/instance/network.modal.html',
        size: 'md',
        resolve: {
          node: function () {
            return vm.instance;
          },
          net: function () {
            return net;
          }
        },
        controller: 'InstanceNetworkModalCtrl'
      });
    };

    vm.openGroupModal = function () {
      $uibModal.open({
        templateUrl: 'scripts/app/main/instance/group.modal.html',
        size: 'md',
        resolve: {
          group: function () {
            return vm.instance;
          }
        },
        controller: 'GroupModalCtrl'
      });
    };

    vm.isTruish = kModelHelper.isTruish;

    vm.isReadOnly = function () {
      // TODO put that code in kModelHelper
      if (vm.instance) {
        var val = vm.instance.findMetaDataByID('access_mode');
        return val && val.value === 'read-only';
      }
      return false;
    };

    vm.isVirtual = function () {
      return kModelHelper.isVirtual(vm.instance);
    };

    function processSelection() {
      $timeout(function () {
        // do the process in a timeout to be sure it gets $digested
        vm.instance = null;
        vm.type = null;
        vm.versions = [];
        vm.dus = null;
        vm.description = '<em>- none -</em>';
        vm.dicAttrs = [];
        vm.fragDicAttrs = [];
        vm.processing = true;

        var selection = kModelHelper.getSelection(kEditor.getModel());
        if (selection.length === 1) {
          vm.instance = selection[0];
          if (vm.instance) {
            vm.instance.selectedVersion = vm.instance.typeDefinition.version;
            angular.element('.ui-notification').css('right', '260px');
            // using preName to prevent user from naming two instances with the same name
            vm.instance.preName = vm.instance.name;
            vm.type = kModelHelper.getTypeDefinitionType(vm.instance.typeDefinition);
            processTypeDefinition();
            vm.processing = false;
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
