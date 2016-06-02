'use strict';

angular.module('editorApp')
  .directive('tabParams', function (kEditor, kModelHelper, kInstance, util) {
    return {
      restrict: 'AE',
      scope: {
        items: '='
      },
      templateUrl: 'scripts/app/treeview/tab-params/tab-params.html',
      link: function ($scope) {
        function convertType(type) {
          switch (type) {
            case 'LONG':
            case 'DOUBLE':
            case 'FLOAT':
            case 'SHORT':
            case 'INT':
              return 'number';

            case 'BOOLEAN':
              return 'boolean';

            default:
              return 'text';
          }
        }

        function process() {
          $scope.error = false;
          $scope.length = {};
          $scope.prepend = {};
          $scope.append = {};
          $scope.min = {};
          $scope.max = {};
          $scope.each = {};
          $scope.toggleEachFlag = false;
          var model = kEditor.getModel();

          if ($scope.items.length > 1) {
            var first = model.findByPath($scope.items[0].path);
            $scope.types = [ first.name + ': ' + first.typeDefinition.name + '/' + first.typeDefinition.version ];
            for (var i=1; i < $scope.items.length; i++) {
              var prev = model.findByPath($scope.items[i-1].path),
                  curr = model.findByPath($scope.items[i].path);
              if (prev.typeDefinition.name !== curr.typeDefinition.name ||
                  prev.typeDefinition.version !== curr.typeDefinition.version) {
                $scope.types.push(curr.name + ': ' + curr.typeDefinition.name + '/' + curr.typeDefinition.version);
                $scope.error = true;
                return;
              }
            }
          }

          $scope.util = util;
          $scope.instance = model.findByPath($scope.items[0].path);
          $scope.type = $scope.instance.typeDefinition;
          $scope.dictionary = [];
          if ($scope.type.dictionaryType) {
            $scope.dictionary = $scope.type.dictionaryType
                .select('attributes[fragmentDependant=false]').array
                .map(function (attr) {
                  var newAttr = {
                    name: attr.name,
                    optional: kModelHelper.isTruish(attr.optional),
                    defaultValue: attr.defaultValue,
                    type: convertType(attr.datatype.name()),
                    value: undefined
                  };
                  return newAttr;
                });
          }
        }

        var unwatchItems = $scope.$watchCollection('items', process);
        $scope.$on('$destroy', function () {
          unwatchItems();
        });
      },
      controller: function ($scope) {
        $scope.applyToAllInstances = function () {
          $scope.items.forEach(function (item) {
            var instance = kEditor.getModel().findByPath(item.path);
            kInstance.initDictionaries(instance);
            $scope.dictionary.forEach(function (attr) {
              var val = instance.dictionary.findValuesByID(attr.name);
              if ($scope.each[attr.name]) {
                $scope.random(attr);
              }
              val.value = attr.value;
            });
          });
          $scope.dictionary.forEach(function (attr) {
            attr.value = null;
          });
        };

        $scope.random = function (attr) {
          switch (attr.type) {
            case 'text':
              attr.value = $scope.prepend[attr.name] + util.randomString($scope.length[attr.name]) + $scope.append[attr.name];
              break;

            case 'number':
              attr.value = util.randomNumber($scope.min[attr.name], $scope.max[attr.name]);
              break;

            case 'boolean':
              attr.value = util.randomBoolean() + '';
              break;
          }
        };

        $scope.allRandom = function () {
          $scope.dictionary.forEach($scope.random);
        };

        $scope.toggleEach = function () {
          $scope.toggleEachFlag = !$scope.toggleEachFlag;
          Object.keys($scope.each).forEach(function (name) {
            $scope.each[name] = $scope.toggleEachFlag;
          });
        };
      }
    };
  });
