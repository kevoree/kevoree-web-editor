'use strict';

angular.module('editorApp')
  .directive('tabCreate', function ($timeout, $filter, kFactory, kEditor, kInstance, kModelHelper, util, KWE_TAG) {
    return {
      restrict: 'E',
      scope: true,
      templateUrl: 'scripts/app/treeview/tab-create/tab-create.html',
      link: function ($scope) {
        $scope.$on('$destroy', $scope.$watchCollection('selectedItems', function () {
          $scope.verifyName();
        }));

        $scope.namePattern = '{metatype}{index}';
        $scope.state = {
          started: true
        };
        $scope.tags = '';

        function createTdefItem(tdef) {
          return { name: kModelHelper.getFqn(tdef), tdef: tdef };
        }

        $scope.verifyName = function () {
          var i, name;
          switch ($scope.selectedType) {
            case 'node':
              for (i = 0; i < $scope.instancesCount; i++) {
                name = $filter('namingPattern')($scope.namePattern, { index: i, metatype: $scope.selectedType });
                if (kEditor.getModel().findNodesByID(name)) {
                  $scope.message = {
                    type: 'danger',
                    content: 'There is already a node named "' + name + '"'
                  };
                  return;
                }
              }
              break;

            case 'group':
              for (i = 0; i < $scope.instancesCount; i++) {
                name = $filter('namingPattern')($scope.namePattern, { index: i, metatype: $scope.selectedType });
                if (kEditor.getModel().findGroupsByID(name)) {
                  $scope.message = {
                    type: 'danger',
                    content: 'There is already a group named "' + name + '"'
                  };
                  return;
                }
              }
              break;

            case 'channel':
              for (i = 0; i < $scope.instancesCount; i++) {
                name = $filter('namingPattern')($scope.namePattern, { index: i, metatype: $scope.selectedType });
                if (kEditor.getModel().findHubsByID(name)) {
                  $scope.message = {
                    type: 'danger',
                    content: 'There is already a channel named "' + name + '"'
                  };
                  return;
                }
              }
              break;

            case 'component':
              if ($scope.selectedItems.length === 0) {
                $scope.message = {
                  type: 'danger',
                  content: 'You must select node instances in the tree view in order to add components'
                };
                return;
              } else {
                for (i = 0; i < $scope.instancesCount; i++) {
                  name = $filter('namingPattern')($scope.namePattern, { index: i, metatype: $scope.selectedType });
                  for (var j = 0; j < $scope.selectedItems.length; j++) {
                    var node = kEditor.getModel().findNodesByID($scope.selectedItems[j].name);
                    if (node) {
                      if (node.findComponentsByID(name)) {
                        $scope.message = {
                          type: 'danger',
                          content: 'There is already a component named "' + name + '" in node "' + node.name + '"'
                        };
                        return;
                      }
                    } else {
                      $scope.message = {
                        type: 'danger',
                        content: '"' + $scope.selectedItems[j].name + '" is not a node instance'
                      };
                      return;
                    }
                  }
                }
              }
              break;
          }

          $scope.message = null;
        };

        function process() {
          var model = kEditor.getModel();
          $scope.tags = '';
          $scope.name = '';
          $scope.types = ['node', 'group', 'channel', 'component'];
          $scope.instanceTypes = {
            node: kModelHelper.getNodeTypes(model).map(createTdefItem),
            group: kModelHelper.getGroupTypes(model).map(createTdefItem),
            channel: kModelHelper.getChannelTypes(model).map(createTdefItem),
            component: kModelHelper.getComponentTypes(model).map(createTdefItem)
          };
          $scope.selectedType = $scope.types[0];
          if ($scope.instanceTypes[$scope.selectedType].length > 0) {
            $scope.selectedInstanceType = $scope.instanceTypes[$scope.selectedType][0];
          }
          $scope.availableNodes = $scope.items.filter(function (item) {
            return item.type === 'node';
          });
          $scope.selectedNode = $scope.availableNodes[0];
          $scope.instancesCount = 1;
          $scope.verifyName();
        }

        process();
        var unregister = kEditor.addNewModelListener('treeview', process);
        var unwatchItems = $scope.$watchCollection('items', process);
        $scope.$on('$destroy', function () {
          unregister();
          unwatchItems();
        });

        function createInstances() {
          var instances = [];
          for (var i = 0; i < $scope.instancesCount; i++) {
            var name = $filter('namingPattern')($scope.namePattern, {
              index: i,
              metatype: $scope.selectedType
            });
            var instance;
            switch ($scope.selectedType) {
              case 'node':
                instance = kFactory.createContainerNode();
                break;
              case 'group':
                instance = kFactory.createGroup();
                break;
              case 'channel':
                instance = kFactory.createChannel();
                break;
              case 'component':
                instance = kFactory.createComponentInstance();
                break;
            }
            instance.name = name;
            instance.typeDefinition = $scope.selectedInstanceType.tdef;
            instance.started = $scope.state.started;
            kInstance.initDictionaries(instance);
            var tags = $scope.tags.split(',')
              .map(function (tag) { return tag.trim(); })
              .filter(function (tag) { return tag.length > 0; })
              .join(',');
            var tagsMeta = kFactory.createValue();
            tagsMeta.name = KWE_TAG;
            tagsMeta.value = tags;
            instance.addMetaData(tagsMeta);
            instances.push(instance);
          }
          return instances;
        }

        $scope.create = function () {
          var model = kEditor.getModel();
          switch ($scope.selectedType) {
            case 'node':
              createInstances().forEach(function (instance) {
                model.addNodes(instance);
                $scope.createItem($scope.selectedType, instance);
              });
              break;
            case 'group':
              createInstances().forEach(function (instance) {
                model.addGroups(instance);
                $scope.createItem($scope.selectedType, instance);
              });
              break;
            case 'channel':
              createInstances().forEach(function (instance) {
                model.addHubs(instance);
                $scope.createItem($scope.selectedType, instance);
              });
              break;
            case 'component':
              $scope.selectedItems.forEach(function (item) {
                // create component instances for the node
                var node = model.findNodesByID(item.name);
                createInstances().forEach(function (instance) {
                  node.addComponents(instance);
                  $scope.createItem($scope.selectedType, instance, node);
                });
              });
              break;
          }
        };

        $scope.onTypeChange = function () {
          $scope.verifyName();
        };

        $scope.areInstanceTypesValid = function () {
          if ($scope.selectedType === 'component') {
            if ($scope.availableNodes.length > 0) {
              return $scope.instanceTypes[$scope.selectedType].length > 0;
            } else {
              return false;
            }
          } else {
            return $scope.instanceTypes[$scope.selectedType].length > 0;
          }
        };

        $scope.isValid = function () {
          if ($scope.selectedType === 'component') {
            if (!$scope.selectedNode) {
              return false;
            }
          }
          return !$scope.message &&
            $scope.namePattern.trim().length > 0 &&
            $scope.selectedType.length > 0 &&
            $scope.instancesCount > 0 &&
            $scope.selectedInstanceType;
        };
      }
    };
  });
