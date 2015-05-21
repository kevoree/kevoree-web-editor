'use strict';

angular.module('editorApp')
    .factory('modelReactor', function (uiFactory) {
        return function modelReactor(trace) {
            if (trace.etype === KevoreeLibrary.modeling.api.util.ActionType.object.REMOVE) {
                console.log('REMOVE >>', trace);
                uiFactory.deleteInstance(trace.previousPath);

            } else if (trace.etype === KevoreeLibrary.modeling.api.util.ActionType.object.ADD) {
                console.log('add', trace);
                switch (trace.elementAttributeName) {
                    case 'hubs':
                        uiFactory.createChannel(trace.value);
                        break;

                    case 'nodes':
                        uiFactory.createNode(trace.value);
                        break;

                    case 'groups':
                        uiFactory.createGroup(trace.value);
                        break;
                }

            } else if (trace.etype === KevoreeLibrary.modeling.api.util.ActionType.object.SET) {
                console.log('set', trace.previousPath, trace.elementAttributeName, trace.value);

            } else if (trace.etype === KevoreeLibrary.modeling.api.util.ActionType.object.REMOVE_ALL) {
                console.log('remove all', trace.value);
            }
        };
    });