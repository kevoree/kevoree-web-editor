'use strict';

angular.module('editorApp')
    .controller('SelectChanModalCtrl', function ($scope, $uibModalInstance, startPort, endPort, orderByFilter, kInstance, kEditor, kFactory, kModelHelper, KWE_POSITION) {
      var selected;
      $scope.instances = orderByFilter(kEditor.getModel().hubs.array.filter(function (chan) {
        chan.selected = false;
        return !kModelHelper.isAlreadyBound(endPort, chan) &&
                !kModelHelper.isAlreadyBound(startPort, chan) &&
                kModelHelper.isCompatible(chan.typeDefinition, startPort.eContainer().eContainer()) &&
                kModelHelper.isCompatible(chan.typeDefinition, endPort.eContainer().eContainer());
      }), 'typeDefinition.name');
      $scope.types = orderByFilter(kModelHelper.getChannelTypes(kEditor.getModel()).filter(function (type) {
        type.selected = false;
        return kModelHelper.isCompatible(type, startPort.eContainer().eContainer()) &&
                kModelHelper.isCompatible(type, endPort.eContainer().eContainer());
      }), 'name');

      if ($scope.types.length > 0) {
        $scope.types[0].selected = true;
        selected = $scope.types[0];
      }

      $scope.isValid = function () {
        for (var i=0; i < $scope.instances.length; i++) {
          if ($scope.instances[i].selected) {
            return true;
          }
        }

        for (i=0; i < $scope.types.length; i++) {
          if ($scope.types[i].selected) {
            return true;
          }
        }

        return false;
      };

      $scope.select = function (chan) {
        if (!chan.selected) {
          $scope.instances.forEach(function (elem) {
            if (chan.path() !== elem.path() && elem.selected) {
              elem.selected = false;
            }
          });
          $scope.types.forEach(function (elem) {
            if (chan.path() !== elem.path() && elem.selected) {
              elem.selected = false;
            }
          });
          chan.selected = !chan.selected;
          selected = chan;
        }
      };

      $scope.confirm = function () {
        var chanInstance;
        if (selected.getRefInParent() === 'typeDefinitions') {
                // selected elem is a TypeDefinition => create an instance
          chanInstance = kFactory.createChannel();
          chanInstance.name = 'chan'+parseInt(Math.random()*1000);
          chanInstance.typeDefinition = selected;
          chanInstance.started = true;
          var pos = kFactory.createValue();
          pos.name = KWE_POSITION;
          pos.value = JSON.stringify({ x: 100, y: 100 });
          chanInstance.addMetaData(pos);
          kInstance.initDictionaries(chanInstance);
          kEditor.getModel().addHubs(chanInstance);
        } else {
          chanInstance = selected;
        }
        $uibModalInstance.close(chanInstance);
      };
    });
