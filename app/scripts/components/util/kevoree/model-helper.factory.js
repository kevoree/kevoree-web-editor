'use strict';

angular.module('editorApp')
    .factory('kModelHelper', function () {
        function getOnlyReleases(tdefs) {
            return tdefs.filter(function (tdef) {
                var v = semver.parse(tdef.version);
                return (v && v.prerelease.length === 0);
            });
        }

        function getOnlySnapshots(tdefs) {
            return tdefs.filter(function (tdef) {
                var v = semver.parse(tdef.version);
                return (v && v.prerelease.length !== 0);
            });
        }

        function getGreater(tdefs) {
            var tdef = tdefs[0];
            for (var i=0; i < tdefs.length; i++) {
                if (semver.gt(tdefs[i].version, tdef.version)) {
                    tdef = tdefs[i];
                }
            }
            return tdef;
        }

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
             * @param tdefs
             * @returns {*}
             */
            findBestVersion: function (tdefs) {
                var onlyReleases = getOnlyReleases(tdefs);
                return getGreater((onlyReleases.length === 0) ? tdefs : onlyReleases);
            },

            /**
             *
             * @param tdefs
             * @returns {*}
             */
            getLatestRelease: function (tdefs) {
                return getGreater(getOnlyReleases(tdefs));
            },

            /**
             *
             * @param tdefs
             * @returns {*}
             */
            getLatestSnapshot: function (tdefs) {
                return getGreater(getOnlySnapshots(tdefs));
            },

            /**
             *
             * @param tdef
             * @returns {Array}
             */
            getPlatforms : function (tdef) {
                var platforms = [];

                tdef.deployUnits.array.forEach(function (du) {
                    var platform = du.findFiltersByID('platform');
                    if (platform && platforms.indexOf(platform.value) === -1) {
                        platforms.push(platform.value);
                    }
                });

                return platforms;
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
                        if (instance.host) {
                            return this.getHighestNode(instance.host);
                        } else {
                            return instance;
                        }
                }
            },

            /**
             * Checks if tdefSrc is compatible with this node instance
             * @param tdef
             * @param node
             */
            isCompatible: function (tdef, node) {
                var nodePlatforms = [];
                node.typeDefinition.deployUnits.array
                    .forEach(function (du) {
                        var filter = du.findFiltersByID('platform');
                        if (filter) {
                            nodePlatforms.push(filter.value);
                        }
                    });


                for (var i=0; i < nodePlatforms.length; i++) {
                    if (tdef.select('deployUnits[name=*]/filters[name=platform,value='+nodePlatforms[i]+']').array.length > 0) {
                        return true;
                    }
                }

                return false;
            },

            /**
             * Tells whether or not a binding is already made between this port and chan
             * @param port
             * @param chan
             * @returns {boolean}
             */
            isAlreadyBound: function (port, chan) {
                var bound = false;
                if (port) {
                    for (var i=0; i < port.bindings.array.length; i++) {
                        if (port.bindings.array[i].hub && (port.bindings.array[i].hub.path() === chan.path())) {
                            return true;
                        }
                    }
                }
                return bound;
            },

            /**
             * Returns true if the given value is truish (means that it is close to say "true")
             * @param val
             * @returns {boolean}
             */
            isTruish: function (val) {
                return (val === true || val === 'true' || val > 0);
            },

            /**
             *
             * @param fqn
             * @returns {string}
             */
            fqnToPath: function (fqn) {
                // check for version
                fqn = fqn.split('/');
                var vers;
                if (fqn.length === 2) {
                    vers = fqn.pop();
                }

                fqn = fqn[0].split('.');
                var last = fqn.pop();
                fqn = 'packages[' + fqn.join(']/packages[') + ']/*[name=' + last;

                if (vers) {
                    fqn += ',version=' + vers;
                }

                fqn += ']';

                return fqn;
            }
        };
    });