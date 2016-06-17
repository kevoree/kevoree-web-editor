'use strict';

angular.module('editorApp')
  .directive('tabParams', function ($timeout, kEditor, kModelHelper, kInstance, util) {
    return {
      restrict: 'E',
      scope: true,
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
          $scope.message = null;
          $scope.error = false;
          $scope.length = {};
          $scope.prepend = {};
          $scope.append = {};
          $scope.min = {};
          $scope.max = {};
          $scope.each = {};
          $scope.toggleEachFlag = false;
          $scope.state = {
            started: null
          };
          $scope.nets = [];

          var model = kEditor.getModel();
          if ($scope.selectedItems.length > 1) {
            var first = model.findByPath($scope.selectedItems[0].path);
            $scope.types = [ first.name + ': ' + kModelHelper.getFqn(first.typeDefinition) ];
            for (var i=1; i < $scope.selectedItems.length; i++) {
              var prev = model.findByPath($scope.selectedItems[i-1].path),
                  curr = model.findByPath($scope.selectedItems[i].path);
              if (kModelHelper.getFqn(prev.typeDefinition) !== kModelHelper.getFqn(curr.typeDefinition)) {
                $scope.types.push(curr.name + ': ' + kModelHelper.getFqn(curr.typeDefinition));
                $scope.error = true;
                return;
              }
            }
          }

          $scope.selectedItems.forEach(function (item) {
            var instance = kEditor.getModel().findByPath(item.path);
            kInstance.initDictionaries(instance);
          });

          $scope.util = util;
          $scope.instance = model.findByPath($scope.selectedItems[0].path);
          if ($scope.selectedItems.length === 1) {
            $scope.state.started = $scope.instance.started;
          } else {
            $scope.state.started = null;
          }
          $scope.type = $scope.instance.typeDefinition;
          $scope.typeName = kModelHelper.getFqn($scope.type);
          $scope.dictionary = [];
          if ($scope.type.dictionaryType) {
            $scope.dictionary = $scope.type.dictionaryType
                .select('attributes[fragmentDependant=false]').array
                .map(function (attr) {
                  var type = convertType(attr.datatype.name());
                  var value;
                  if ($scope.selectedItems.length === 1 && $scope.instance.dictionary) {
                    var val = $scope.instance.dictionary.findValuesByID(attr.name);
                    if (val) {
                      switch (type) {
                        case 'number':
                          value = +val.value;
                          break;
                        default:
                          value = val.value;
                          break;
                      }
                    }
                  }
                  var newAttr = {
                    name: attr.name,
                    optional: kModelHelper.isTruish(attr.optional),
                    defaultValue: attr.defaultValue,
                    type: type,
                    value: value
                  };
                  return newAttr;
                });
          }

          if ($scope.instance.networkInformation) {
            $scope.instance.networkInformation.array.forEach(function (net) {
              $scope.nets.push({
                name: net.name,
                values: net.values.array.map(function (val) {
                  return { name: val.name, value: val.value };
                })
              });
            });
          }
        }

        process();
        var unwatchItems = $scope.$watchCollection('selectedItems', process);
        $scope.$on('$destroy', unwatchItems);

        $scope.applyToAllInstances = function () {
          try {
            $scope.selectedItems.forEach(function (item) {
              var instance = kEditor.getModel().findByPath(item.path);
              instance.started = $scope.state.started;
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
            process();
            $scope.message = { type: 'success', content: 'Success' };
          } catch (err) {
            $scope.message = { type: 'danger', content: 'Error (check console for more information)' };
            console.error(err);
          }

          $timeout(function () {
            $scope.message = null;
          }, 1500);
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
