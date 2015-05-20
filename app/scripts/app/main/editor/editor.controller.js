'use strict';

/**
 * @ngdoc function
 * @name editorApp.controller:EditorCtrl
 * @description
 * # EditorCtrl
 * Controller of the editorApp editor
 */
angular.module('editorApp')
    .controller('EditorCtrl', function ($scope, kEditor, uiFactory, kModelHelper) {
        $scope.dropDroppable = {
            onDrop: 'onDrop'
        };
        $scope.dropOptions = {
            accept: function (obj) {
                var pkgPath = obj[0].dataset.pkgPath;
                var tdefName = obj[0].innerHTML.trim();
                var tdefs = kEditor.getModel().select(pkgPath+'/typeDefinitions[name='+tdefName+']');
                var tdef = kModelHelper.findBestVersion(tdefs.array);
                var type = kModelHelper.getTypeDefinitionType(tdef);
                // TODO
                console.log('TODO accept for ', pkgPath, tdef, type);
                return true;
            }
        };

        $scope.onDrop = function (evt, obj) {
            var pkgPath = obj.helper[0].dataset.pkgPath;
            var tdefName = obj.helper[0].innerHTML.trim();
            var tdefs = kEditor.getModel().select(pkgPath+'/typeDefinitions[name='+tdefName+']');
            var tdef = kModelHelper.findBestVersion(tdefs.array);
            var type = kModelHelper.getTypeDefinitionType(tdef);

            var model = kEditor.getModel();
            var factory = new KevoreeLibrary.factory.DefaultKevoreeFactory();
            var instance;
            switch (type) {
                case 'node':
                    instance = factory.createContainerNode();
                    instance.name = 'node'+parseInt(Math.random()*1000);
                    instance.typeDefinition = tdef;
                    model.addNodes(instance);
                    //uiFactory.createNode(instance);
                    break;

                case 'group':
                    instance = factory.createGroup();
                    instance.name = 'grp'+parseInt(Math.random()*1000);
                    instance.typeDefinition = tdef;
                    model.addGroups(instance);
                    //uiFactory.createGroup(instance);
                    break;

                case 'component':
                    instance = factory.createComponentInstance();
                    instance.name = 'comp'+parseInt(Math.random()*1000);
                    instance.typeDefinition = tdef;
                    console.log('TODO add comp logic');
                    //uiFactory.createComponent(instance);
                    break;

                case 'channel':
                    instance = factory.createChannel();
                    instance.name = 'chan'+parseInt(Math.random()*1000);
                    instance.typeDefinition = tdef;
                    model.addHubs(instance);
                    //uiFactory.createChannel(instance);
                    break;
            }
        };

        // init the UI factory
        uiFactory.init();

        /**
         * Create svg UIs based on current kEditor.getModel()
         */
        function processModel() {
            var model = kEditor.getModel();

            model.groups.array.forEach(function (elem) {
                uiFactory.createGroup(elem);
            });

            model.nodes.array.forEach(function (elem) {
                uiFactory.createNode(elem);
            });

            model.hubs.array.forEach(function (elem) {
                uiFactory.createChannel(elem);
            });
        }

        // listen to model changes on the editor
        kEditor.addListener(processModel);

        // process model to create the instance UIs
        processModel();

        $scope.$on('$destroy', function () {
            kEditor.removeListener(processModel);
        });
    });
