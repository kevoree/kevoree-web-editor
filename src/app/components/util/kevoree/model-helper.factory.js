'use strict';

angular.module('editorApp')
  .factory('kModelHelper', function (kFactory, KWE_POSITION, KWE_TAG, KWE_SELECTED, KWE_FOLDED) {
    function genNewName(instance, type, count) {
      if (typeof count === 'undefined') {
        count = 0;
      }
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

      getFqn: function (tdef) {
        var pkg = this.genPkgName(tdef.eContainer());
        if (pkg === 'org.kevoree.library') {
          pkg = '';
        } else {
          pkg += '.';
        }
        return pkg + tdef.name + '/' + tdef.version;
      },

      /**
       *
       * @param tdef
       * @returns {*}
       */
      getTypeDefinitionType: function (tdef) {
        if (tdef) {
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
        }
        return null;
      },

      /**
       *
       * @param tdefs
       * @returns {*}
       */
      findBestVersion: function (tdefs) {
        var best = tdefs[0];
        for (var i=1; i < tdefs.length; i++) {
          if (parseInt(best.version, 10) <= parseInt(tdefs[i].version, 10)) {
            best = tdefs[i];
          }
        }
        return best;
      },

      /**
       *
       * @param tdef
       * @returns {Array}
       */
      getPlatforms: function (tdef) {
        var platforms = [];

        if (tdef) {
          tdef.deployUnits.array.forEach(function (du) {
            var platform = du.findFiltersByID('platform');
            if (platform && platforms.indexOf(platform.value) === -1) {
              platforms.push(platform.value);
            }
          });
        }

        return platforms;
      },

      /**
       * Returns the list of KWE_TAG from the instance if any
       * @param instance
       * @returns {array}
       */
      getTags: function (instance) {
        var tags = [];
        var meta = instance.findMetaDataByID(KWE_TAG);
        if (meta && meta.value.length > 0) {
          tags = meta.value.split(',');
        }
        return tags;
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
       * Returns all the node types of the given model
       */
      getNodeTypes: function (model) {
        return model.select('**/typeDefinitions[*]').array.filter(function (tdef) {
          return tdef.metaClassName() === 'org.kevoree.NodeType';
        });
      },

      /**
       * Returns all the group types of the given model
       */
      getGroupTypes: function (model) {
        return model.select('**/typeDefinitions[*]').array.filter(function (tdef) {
          return tdef.metaClassName() === 'org.kevoree.GroupType';
        });
      },

      /**
       * Returns all the component types of the given model
       */
      getComponentTypes: function (model) {
        return model.select('**/typeDefinitions[*]').array.filter(function (tdef) {
          return tdef.metaClassName() === 'org.kevoree.ComponentType';
        });
      },

      /**
       * Returns all the channel types of the given model
       */
      getChannelTypes: function (model) {
        return model.select('**/typeDefinitions[*]').array.filter(function (tdef) {
          return tdef.metaClassName() === 'org.kevoree.ChannelType';
        });
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

      getNbInstances: function (model) {
        return this.getNbNodes(model) +
          this.getNbGroups(model) +
          this.getNbChannels(model) +
          this.getNbComponents(model);
      },

      getNbNodes: function (model) {
        return model.nodes.array.length;
      },

      getNbGroups: function (model) {
        return model.groups.array.length;
      },

      getNbChannels: function (model) {
        return model.hubs.array.length;
      },

      getNbComponents: function (model) {
        var count = 0;
        model.nodes.array.forEach(function (node) {
          count += node.components.array.length;
        });
        return count;
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
        if (tdef && node) {
          if (tdef.select('metaData[name=virtual]').array.length > 0) {
            // tdef is virtual, so it is compatible
            return true;

          } else {
            var nodePlatforms = [];
            node.typeDefinition.deployUnits.array
              .forEach(function (du) {
                var filter = du.findFiltersByID('platform');
                if (filter) {
                  nodePlatforms.push(filter.value);
                }
              });

            for (var i = 0; i < nodePlatforms.length; i++) {
              if (tdef.select('deployUnits[name=*]/filters[name=platform,value=' + nodePlatforms[i] + ']').array.length > 0) {
                return true;
              }
            }
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
          for (var i = 0; i < port.bindings.array.length; i++) {
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
        if (instance.typeDefinition &&
          instance.typeDefinition.dictionaryType &&
          instance.typeDefinition.dictionaryType.attributes.array.length > 0) {
          if (instance.dictionary &&
            instance.dictionary.values.array.length > 0) {
            for (var i = 0; i < instance.dictionary.values.array.length; i++) {
              var val = instance.dictionary.values.array[i];
              var attr = instance.typeDefinition.dictionaryType.findAttributesByID(val.name);
              if (!this.isValueValid(val, attr)) {
                return false;
              }
            }
          } else {
            for (var j = 0; j < instance.typeDefinition.dictionaryType.attributes.array.length; j++) {
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

      isVirtual: function (elem) {
        if (elem) {
          if (elem.metaClassName() === 'org.kevoree.ComponentInstance' ||
              elem.metaClassName() === 'org.kevoree.ContainerNode' ||
              elem.metaClassName() === 'org.kevoree.Group' ||
              elem.metaClassName() === 'org.kevoree.Channel') {
            return this.isVirtual(elem.typeDefinition);
          } else if (elem.metaClassName() === 'org.kevoree.ComponentType' ||
              elem.metaClassName() === 'org.kevoree.NodeType' ||
              elem.metaClassName() === 'org.kevoree.GroupType' ||
              elem.metaClassName() === 'org.kevoree.ChannelType') {
            var virtual = elem.findMetaDataByID('virtual');
            return virtual !== null;
          } else if (elem.metaClassName() === 'org.kevoree.MBinding') {
            if (elem.hub) {
              return this.isVirtual(elem.hub.typeDefinition);
            }
          }
        }
        return false;
      },

      /**
       * @param channel instance
       * @returns false if channel is only fragmented on one node
       */
      isChannelDistributed: function (channel) {
        var nodes = {};

        channel.bindings.array.forEach(function (binding) {
          if (binding.port && binding.port.eContainer()) {
            var comp = binding.port.eContainer();
            var node = this.getHighestNode(comp);
            nodes[node.path()] = true;
          }
        }.bind(this));

        return Object.keys(nodes).length > 1;
      },

      isSelected: function (instance) {
        if (instance && instance.findMetaDataByID) {
          var meta = instance.findMetaDataByID(KWE_SELECTED);
          if (meta) {
            return this.isTruish(meta.value);
          }
        }
        return false;
      },

      isFolded: function (instance) {
        if (instance && instance.findMetaDataByID) {
          var meta = instance.findMetaDataByID(KWE_FOLDED);
          if (meta) {
            return this.isTruish(meta.value);
          }
        }
        return false;
      },

      setSelected: function (instance, selected) {
        if (instance && instance.findMetaDataByID) {
          var meta = instance.findMetaDataByID(KWE_SELECTED);
          if (!meta) {
            meta = kFactory.createValue();
            meta.name = KWE_SELECTED;
            instance.addMetaData(meta);
          }
          meta.value = selected;
        }
      },

      setFolded: function (instance, folded) {
        if (instance) {
          var meta = instance.findMetaDataByID(KWE_FOLDED);
          if (!meta) {
            meta = kFactory.createValue();
            meta.name = KWE_FOLDED;
            instance.addMetaData(meta);
          }
          meta.value = folded;
        }
      },

      isAttributeInType: function (instance, attrName, isFragment) {
        if (instance.typeDefinition.dictionaryType) {
          var attr = instance.typeDefinition.dictionaryType.findAttributesByID(attrName);
          return attr && (attr.fragmentDependant === isFragment);
        }
        return false;
      },

      getSelection: function (model) {
        return model.select('**/metaData[name=' + KWE_SELECTED + ',value=true]').array.map(function (meta) {
          return meta.eContainer();
        });
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
          return 'packages[' + last + ']';
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
        var clone = kFactory.createDictionary().withGenerated_KMF_ID('0.0');
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
