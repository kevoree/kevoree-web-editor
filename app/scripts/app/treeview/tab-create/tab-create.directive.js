'use strict';

angular.module('editorApp')
  .directive('tabCreate', function ($timeout, $filter, kFactory, kEditor, kInstance, kModelHelper, util, KWE_TAG) {
    return {
      restrict: 'AE',
      scope: {
        onCreate: '=',
        items: '='
      },
      templateUrl: 'scripts/app/treeview/tab-create/tab-create.html',
      link: function (scope) {
        scope.namePattern = '{metatype}{index}';

        function createTdefItem(tdef) {
          return { name: kModelHelper.getFqn(tdef), tdef: tdef };
        }

        scope.verifyName = function () {
          var i, name;
          switch (scope.selectedType) {
            case 'node':
              for (i=0; i < scope.instancesCount; i++) {
                name = $filter('namingPattern')(scope.namePattern, { index: i, metatype: scope.selectedType });
                if (kEditor.getModel().findNodesByID(name)) {
                  scope.message = {
                    type: 'danger',
                    content: 'There is already a node named "'+name+'"'
                  };
                  return;
                }
              }
              break;

            case 'group':
              for (i=0; i < scope.instancesCount; i++) {
                name = $filter('namingPattern')(scope.namePattern, { index: i, metatype: scope.selectedType });
                if (kEditor.getModel().findGroupsByID(name)) {
                  scope.message = {
                    type: 'danger',
                    content: 'There is already a group named "'+name+'"'
                  };
                  return;
                }
              }
              break;

            case 'channel':
              for (i=0; i < scope.instancesCount; i++) {
                name = $filter('namingPattern')(scope.namePattern, { index: i, metatype: scope.selectedType });
                if (kEditor.getModel().findHubsByID(name)) {
                  scope.message = {
                    type: 'danger',
                    content: 'There is already a channel named "'+name+'"'
                  };
                  return;
                }
              }
              break;

            case 'component':
              if (scope.selectedNode) {
                for (i=0; i < scope.instancesCount; i++) {
                  name = $filter('namingPattern')(scope.namePattern, { index: i, metatype: scope.selectedType });
                  if (kEditor.getModel().findNodesByID(scope.selectedNode.name).findComponentsByID(name)) {
                    scope.message = {
                      type: 'danger',
                      content: 'There is already a component named "'+name+'" in node "'+scope.selectedNode.name+'"'
                    };
                    return;
                  }
                }
              }
              break;
          }

          scope.message = null;
        };

        function process() {
          var model = kEditor.getModel();
          scope.name = '';
          scope.types = [ 'node', 'group', 'channel', 'component' ];
          scope.instanceTypes = {
            node: kModelHelper.getNodeTypes(model).map(createTdefItem),
            group: kModelHelper.getGroupTypes(model).map(createTdefItem),
            channel: kModelHelper.getChannelTypes(model).map(createTdefItem),
            component: kModelHelper.getComponentTypes(model).map(createTdefItem)
          };
          scope.selectedType = scope.types[0];
          if (scope.instanceTypes[scope.selectedType].length > 0) {
            scope.selectedInstanceType = scope.instanceTypes[scope.selectedType][0];
          }
          scope.availableNodes = scope.items.filter(function (item) {
            return item.type === 'node';
          });
          scope.selectedNode = scope.availableNodes[0];
          scope.instancesCount = 1;
          scope.tags = '';
          scope.verifyName();
        }

        process();
        var unregister = kEditor.addNewModelListener('treeview', process);
        var unwatchItems = scope.$watchCollection('items', process);
        scope.$on('$destroy', function () {
          unregister();
          unwatchItems();
        });

        scope.create = function () {
          var model = kEditor.getModel();
          for (var i=0; i < scope.instancesCount; i++) {
            var name = $filter('namingPattern')(scope.namePattern, {
              index: i,
              metatype: scope.selectedType
            });
            var instance;
            switch (scope.selectedType) {
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
            instance.typeDefinition = scope.selectedInstanceType.tdef;
            instance.started = 'true';
            kInstance.initDictionaries(instance);
            var tags = scope.tags.split(',')
                .map(function (tag) {
                  return tag.trim();
                })
                .filter(function (tag) {
                  return tag.length > 0;
                }).join(',');
            var tagsMeta = kFactory.createValue();
            tagsMeta.name = KWE_TAG;
            tagsMeta.value = tags;
            instance.addMetaData(tagsMeta);

            switch (scope.selectedType) {
              case 'node':
                model.addNodes(instance);
                scope.onCreate(scope.selectedType, instance);
                break;
              case 'group':
                model.addGroups(instance);
                scope.onCreate(scope.selectedType, instance);
                break;
              case 'channel':
                model.addHubs(instance);
                scope.onCreate(scope.selectedType, instance);
                break;
              case 'component':
                var node = model.findNodesByID(scope.selectedNode.name);
                node.addComponents(instance);
                scope.onCreate(scope.selectedType, instance, node);
                break;
            }
          }
        };

        scope.onTypeChange = function () {
          if (scope.instanceTypes[scope.selectedType].length > 0) {
            scope.selectedInstanceType = $filter('isCompatible')(
              scope.instanceTypes[scope.selectedType],
              scope.selectedType,
              (scope.selectedNode) ? scope.selectedNode.name : null
            )[0];
            scope.verifyName();
          }
        };

        scope.onSelectedNodeChange = function (node) {
          scope.selectedNode = node;
          scope.selectedInstanceType = $filter('isCompatible')(
            scope.instanceTypes[scope.selectedType],
            scope.selectedType,
            (scope.selectedNode) ? scope.selectedNode.name : null
          )[0];
          scope.verifyName();
        };

        scope.areInstanceTypesValid = function () {
          if (scope.selectedType === 'component') {
            if (scope.availableNodes.length > 0) {
              return scope.instanceTypes[scope.selectedType].length > 0;
            } else {
              return false;
            }
          } else {
            return scope.instanceTypes[scope.selectedType].length > 0;
          }
        };

        scope.isValid = function () {
          if (scope.selectedType === 'component') {
            if (!scope.selectedNode) {
              return false;
            }
          }
          return !scope.message &&
                 scope.namePattern.trim().length > 0 &&
                 scope.selectedType.length > 0 &&
                 scope.instancesCount > 0 &&
                 scope.selectedInstanceType !== null;
        };
      }
    };
  });
