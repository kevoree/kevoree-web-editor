'use strict';

angular.module('editorApp')
    .factory('kModelHelper', function (kFactory, KWE_POSITION) {

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

        function genNewName(instance, type, count) {
            if (typeof count === 'undefined') { count = 0; }
            var newName = instance.name + '_' + count;
            var conflictInst;
            switch (type) {
                case 'node':
                    conflictInst = instance.eContainer().findNodesByID(newName);
                    if (conflictInst) {
                        newName = genNewName(instance, type, ++count);
                    }
                    break;

                case 'group':
                    conflictInst = instance.eContainer().findGroupsByID(newName);
                    if (conflictInst) {
                        newName = genNewName(instance, type, ++count);
                    }
                    break;

                case 'channel':
                    conflictInst = instance.eContainer().findHubsByID(newName);
                    if (conflictInst) {
                        newName = genNewName(instance, type, ++count);
                    }
                    break;

                case 'component':
                    conflictInst = instance.eContainer().findComponentsByID(newName);
                    if (conflictInst) {
                        newName = genNewName(instance, type, ++count);
                    }
                    break;
            }
            return newName;
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
                switch (tdef.metaClassName()) {
                    case 'org.kevoree.NodeType':
                        return 'node';

                    case 'org.kevoree.GroupType':
                        return 'group';

                    case 'org.kevoree.ComponentType':
                        return 'component';

                    case 'org.kevoree.ChannelType':
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
             * Returns true if the given instance dictionaries are valid
             * @param instance
             * @returns {boolean}
             */
            isValid: function (instance) {
                if (instance.typeDefinition.dictionaryType && instance.typeDefinition.dictionaryType.attributes.array.length > 0) {
                    if (instance.dictionary && instance.dictionary.values.array.length > 0) {
                        for (var i=0; i < instance.dictionary.values.array.length; i++) {
                            var val = instance.dictionary.values.array[i];
                            var attr = instance.typeDefinition.dictionaryType.findAttributesByID(val.name);
                            if (!this.isValueValid(val, attr)) {
                                return false;
                            }
                        }
                    } else {
                        for (var j=0; j < instance.typeDefinition.dictionaryType.attributes.array.length; j++) {
                            if (!this.isTruish(instance.typeDefinition.dictionaryType.attributes.array[j].optional)) {
                                return false;
                            }
                        }
                    }
                }

                return true;
            },

            /**
             *
             *
             */
            isValueValid: function (val, attr) {
                if (!this.isTruish(attr.optional)) {
                    if (typeof val.value === 'undefined' || val.value === null || val.value.length === 0) {
                        return false;
                    }
                }
                return true;
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
                if (fqn.length === 0) {
                  fqn = 'packages[name=' + last;
                } else {
                  fqn = 'packages[' + fqn.join(']/packages[') + ']/*[name=' + last;
                }

                if (vers) {
                    fqn += ',version=' + vers;
                }

                fqn += ']';

                return fqn;
            },

            /**
             *
             * @param fqn
             * @returns {string}
             */
            pkgFqnToPath: function (fqn) {
                fqn = fqn.split('.');
                var last = fqn.pop();
                if (fqn.length === 0) {
                  return 'packages['+last+']';
                } else {
                  return 'packages[' + fqn.join(']/packages[') + ']/packages[' + last + ']';
                }
            },

            /**
             *
             * @param instance the instance to clone
             */
            clone: function (instance) {
                var that = this;

                function initClone(clone) {
                    clone.started = instance.started;
                    var instancePosMeta = instance.findMetaDataByID(KWE_POSITION);
                    if (instancePosMeta) {
                        var instancePos = JSON.parse(instancePosMeta.value);
                        var pos = kFactory.createValue();
                        pos.name = KWE_POSITION;
                        pos.value = JSON.stringify({
                            x: instancePos.x + 50,
                            y: instancePos.y + 50
                        });
                        clone.addMetaData(pos);
                    }

                    clone.dictionary = that.cloneDictionary(instance.dictionary);
                }

                var clone;
                switch (this.getTypeDefinitionType(instance.typeDefinition)) {
                    case 'node':
                        clone = kFactory.createContainerNode();
                        initClone(clone);
                        clone.typeDefinition = instance.eContainer().findByPath(instance.typeDefinition.path());
                        clone.name = genNewName(instance, 'node');
                        instance.components.array.forEach(function (comp) {
                            clone.addComponents(that.clone(comp));
                        });
                        instance.hosts.array.forEach(function (subNode) {
                            var clonedNode = that.clone(subNode);
                            instance.eContainer().addNodes(clonedNode);
                            clone.addHosts(clonedNode);
                        });
                        break;

                    case 'group':
                        clone = kFactory.createGroup();
                        initClone(clone);
                        clone.typeDefinition = instance.eContainer().findByPath(instance.typeDefinition.path());
                        clone.name = genNewName(instance, 'group');
                        break;

                    case 'channel':
                        clone = kFactory.createChannel();
                        initClone(clone);
                        clone.typeDefinition = instance.eContainer().findByPath(instance.typeDefinition.path());
                        clone.name = genNewName(instance, 'channel');
                        break;

                    case 'component':
                        clone = kFactory.createComponentInstance();
                        initClone(clone);
                        clone.typeDefinition = instance.eContainer().eContainer().findByPath(instance.typeDefinition.path());
                        clone.name = genNewName(instance, 'component');
                        break;
                }

                return clone;
            },

            /**
             * @param dic a dictionary
             */
            cloneDictionary: function (dic) {
                var clone = kFactory.createDictionary();
                if (dic) {
                    dic.values.array.forEach(function (val) {
                        var newVal = kFactory.createValue();
                        newVal.name = val.name;
                        newVal.value = val.value;
                        clone.addValues(newVal);
                    });
                }
                return clone;
            }
        };
    });
