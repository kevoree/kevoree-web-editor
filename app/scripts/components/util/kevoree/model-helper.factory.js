'use strict';

angular.module('editorApp')
    .factory('kModelHelper', function () {
        return {
            genPkgName: function (pkg) {
                var name = pkg.name;
                function walk(elem) {
                    if (elem.eContainer()) {
                        name = elem.name + '.' + name;
                        walk(elem.eContainer());
                    }
                }
                walk(pkg.eContainer());
                return name;
            },

            getTypeDefinitionType: function (tdef) {
                if (Kotlin.isType(tdef, KevoreeLibrary.NodeType)) {
                    return 'node';
                } else if (Kotlin.isType(tdef, KevoreeLibrary.ComponentType)) {
                    return 'component';
                } else if (Kotlin.isType(tdef, KevoreeLibrary.GroupType)) {
                    return 'group';
                } else if (Kotlin.isType(tdef, KevoreeLibrary.ChannelType)) {
                    return 'channel';
                }
            }
        };
    });