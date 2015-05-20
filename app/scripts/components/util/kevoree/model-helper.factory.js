'use strict';

angular.module('editorApp')
    .factory('kModelHelper', function () {
        return {
            /**
             *
             * @param pkg
             * @returns {*}
             */
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

            /**
             *
             * @param tdef
             * @returns {*}
             */
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
            },

            /**
             *
             * @param {Array} tdefs
             */
            findBestVersion: function (tdefs) {
                var onlyReleases = tdefs.filter(function (tdef) {
                    var v = semver.parse(tdef.version);
                    if (v.prerelease.length === 0) {
                        return tdef;
                    }
                });

                function getGreater(tdefs) {
                    var tdef = tdefs[0];
                    for (var i=0; i < tdefs.length; i++) {
                        if (semver.gt(tdefs[i].version, tdef.version)) {
                            tdef = tdefs[i];
                        }
                    }
                    return tdef;
                }

                return getGreater((onlyReleases.length === 0) ? tdefs : onlyReleases);
            }
        };
    });