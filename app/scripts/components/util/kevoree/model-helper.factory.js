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
            },

            /**
             *
             * @param node
             * @returns {number}
             */
            getNodeTreeHeight: function getNodeTreeHeight(node) {
                if (node.hosts.size() === 0) {
                    return 0;
                }

                var heights = node.hosts.array.map(getNodeTreeHeight);
                var max = 0;
                heights.forEach(function (height) {
                    if (height > max) {
                        max = height;
                    }
                });
                return max + 1;
            },

            /**
             *
             * @param nodes
             * @returns {Array}
             */
            getNodeTreeHeights: function (nodes) {
                var heights = [];
                nodes.forEach(function (node) {
                    var height = this.getNodeTreeHeight(node);
                    if (heights.indexOf(height) === -1) {
                        heights.push(height);
                    }
                }.bind(this));
                return heights;
            },

            /**
             *
             * @param comp
             * @returns {number}
             */
            getCompDepth: function (comp) {
                var depth = 0;

                function walk(node) {
                    if (node.host) {
                        depth += 1;
                        walk(node.host);
                    }
                }
                walk(comp.eContainer());

                return depth;
            },

            /**
             * Returns the highest node instance containing this component or node
             * @param instance ContainerNode
             */
            getHighestNode: function (instance) {
                switch (instance.getRefInParent()) {
                    case 'components':
                        return this.getHighestNode(instance.eContainer());

                    case 'hosts':
                        return this.getHighestNode(instance.host);

                    case 'nodes':
                        return instance;
                }
            },

            /**
             * Returns true if the given value is truish (means that it is close to say "true")
             * @param val
             * @returns {boolean}
             */
            isTruish: function (val) {
                return (val === true || val === 'true' || val > 0);
            }
        };
    });