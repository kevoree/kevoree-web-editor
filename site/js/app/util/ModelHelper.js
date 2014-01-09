define(
  [
    'lib/kevoree',
    'lib/kotlin/kotlin',
    'util/Config'
  ],
  function (Kevoree, Kotlin, Config) {

    function ModelHelper () {
      this._factory = new Kevoree.org.kevoree.impl.DefaultKevoreeFactory();
    }

    ModelHelper.prototype.getLibraries = function (model) {
      var ret = [];

      // inflate TypeDefinitions by browsing libraries
      var libz = model.getLibraries();
      for (var i=0; i < libz.size(); i++) {
        var lib = libz.get(i);
        ret.push({
          name: lib.getName(),
          components: (function (tDefs) {
            var compz = [];
            for (var i=0; i < tDefs.size(); i++) {
              addTDefToArray(tDefs.get(i), compz);
            }
            return compz;
          })(lib.getSubTypes())
        });
      }

      // add to "Default" library components that are not in any libraries' subtypes
      var tDefs = model.getTypeDefinitions(),
        defaultCompz = [];

      for (var i=0; i < tDefs.size(); i++) {
        var inLib = false;
        for (var j=0; j < ret.length; j++) {
          if (arrayContainsTDef(ret[j].components, tDefs.get(i))) {
            inLib = true;
          }
        }
        if (!inLib) {
          addTDefToArray(tDefs.get(i), defaultCompz);
        }
      }

      // do not add default libTree if there is no library-less comp
      if (defaultCompz.length > 0) {
        ret.push({
          name: 'Default',
          components: defaultCompz
        });
      }

      return ret;
    }

    /**
     *
     * @param nodeProps KNodeProperties object
     * @param group KGroup object
     * @param [portAttName] your port-like attribute name (default is 'port')
     * @param [defaultPortValue] default value for 'port' (default is '8000')
     */
    ModelHelper.prototype.getNodeURIs = function (nodeProps, group, portAttName, defaultPortValue) {
      var links = nodeProps.getLinks();
      portAttName = portAttName || Config.DEFAULT_PORT_NAME; // default 'port' attribute name
      var fragPort = defaultPortValue || Config.DEFAULT_PORT_VAL; // default port
      var fragDics = group.getFragmentDictionaries();
      for (var i=0; i < fragDics.length; i++) {
        if (fragDics[i].getName() === nodeProps.getNode().getName() && fragDics[i].getValue(portAttName)) {
          fragPort = fragDics[i].getValue(portAttName).getValue();
        }
      }

      var uris = [];
      for (var i=0; i < links.length; i++) {
        var netProps = links[i].getNetworkProperties();
        for (var j=0; j < netProps.length; j++) {
          uris.push('ws://'+netProps[j].getValue()+':'+fragPort);
        }
      }

      return uris;
    }

    // private method
    function addTDefToArray(tDef, array) {
      var type = "UnknownType";
      var version = tDef.version || '';

      if (Kotlin.isType(tDef, Kevoree.org.kevoree.impl.ComponentTypeImpl)) {
        type = "ComponentType";

      } else if (Kotlin.isType(tDef, Kevoree.org.kevoree.impl.GroupTypeImpl)) {
        type = "GroupType"

      } else if (Kotlin.isType(tDef, Kevoree.org.kevoree.impl.ChannelTypeImpl)) {
        type = "ChannelType";

      } else if (Kotlin.isType(tDef, Kevoree.org.kevoree.impl.NodeTypeImpl)) {
        type = "NodeType";

      } else {
        //console.log("not handled for now", tDef.getName());
      }

      array.push({
        name: tDef.getName(),
        type: type,
        version: version
      });
    }

    // private method
    function arrayContainsTDef(array, tDef) {
      for (var i=0; i < array.length; i++) {
        if (array[i].name == tDef.getName()) return true;
      }
      return false;
    }

    return new ModelHelper();
  }
);