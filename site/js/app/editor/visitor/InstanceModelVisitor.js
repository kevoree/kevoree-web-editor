define(
  [
    'util/Util',
    'abstraction/KComponent',
    'abstraction/KNode'
  ],
  function (Util, KComponent, KNode) {

    /**
     * Visit model in order to load instances in the editor
     * @constructor
     */
    function InstanceModelVisitor() {
      this._factory = require('factory/CFactory').getInstance();
    }

    InstanceModelVisitor.prototype.visitEditor = function (editor) {
      var model = editor.getModel();

      visitNodes(editor, this._factory, model.getNodes());
      visitGroups(editor, this._factory, model.getGroups());
      visitChannels(editor, this._factory, model.getHubs());
      visitComponents(editor, this._factory, model.getNodes());
      visitBindings(editor, this._factory, model.getMBindings());
      visitSubNodes(editor, this._factory, model.getGroups());
      visitNodeNetworks(editor, this._factory, model.getNodeNetworks());
    }

    function visitNodes(editor, factory, kNodes) {
      for (var i=0; i < kNodes.size(); i++) {
        var node = kNodes.get(i);
        var entity = factory.newNode(editor, node.getTypeDefinition().getName(), node.getTypeDefinition().getVersion());
        entity._instance = node;
        entity.setName(node.getName());

        // check if this node has already been added to editor
        if (!editor.hasEntity(entity)) {
          // this is a new node for the editor
          if (!node.getHost()) {
            // this node has no parent, add it to editor
            editor.addEntity(entity);
            loadMetaData(entity, node);
            loadDictionaryValues(entity, node, factory);
          }

          if (node.getHost()) {
            // this node has a parent
            var parent = editor.getEntity(node.getHost().getName());
            parent.addChild(entity);
            loadDictionaryValues(entity, node, factory);
          }
        }
      }
    }

    function visitGroups(editor, factory, kGrps) {
      var entity = null;
      var grp = null;
      for (var i=0; i < kGrps.size(); i++) {
        grp = kGrps.get(i);
        entity = factory.newGroup(editor, grp.getTypeDefinition().getName(), grp.getTypeDefinition().getVersion());
        entity._instance = grp;

        entity.setName(grp.getName());
        editor.addEntity(entity);
        loadMetaData(entity, grp);
        loadDictionaryValues(entity, grp, factory);
      }
    }

    function visitComponents(editor, factory, kNodes) {
      var entity = null;
      var node = null;
      for (var i=0; i < kNodes.size(); i++) {
        node = kNodes.get(i);
        var entityNode = editor.getEntity(node.getName());
        if (entityNode != null) {
          var compz = node.getComponents();
          for (var j=0; j < compz.size(); j++) {
            var comp = compz.get(j);
            entity = factory.newComponent(editor, comp.getTypeDefinition().getName(), comp.getTypeDefinition().getVersion());
            entity._instance = comp;
            entity.setName(comp.getName());
            entityNode.addChild(entity);
            loadDictionaryValues(entity, comp, factory);
          }
        }
      }
    }

    function visitChannels(editor, factory, kChans) {
      var entity = null;
      var chan = null;
      for (var i=0; i < kChans.size(); i++) {
        chan = kChans.get(i);
        entity = factory.newChannel(editor, chan.getTypeDefinition().getName(), chan.getTypeDefinition().getVersion());
        entity._instance = chan;
        entity.setName(chan.getName());
        editor.addEntity(entity);
        loadMetaData(entity, chan);
        loadDictionaryValues(entity, chan, factory);
      }
    }

    function visitSubNodes(editor, factory, kGrps) {
      for (var i=0; i < kGrps.size(); i++) {
        var subNodes = kGrps.get(i).getSubNodes();
        for (var j=0; j < subNodes.$size; j++) {
          var grp = editor.getEntity(kGrps.get(i).getName());
          var node = editor.getEntity(subNodes.get(j).getName());
          if (grp != null && node != null) {
            var wire = factory.newWire(grp);
            wire.setTarget(node);
            grp.addWire(wire);
            node.addWire(wire);
          }
        }
      }
    }

    function visitBindings(editor, factory, kBindings) {
      for (var i=0; i < kBindings.size(); i++) {
        var port = kBindings.get(i).getPort(),
          hub = kBindings.get(i).getHub();

        if (port && hub) {
          var comp = editor.getEntity(port.eContainer().getName()),
            chan = editor.getEntity(hub.getName());
          if (comp && chan) {
            for (var j=0; j < port.eContainer().getProvided().size(); j++) {
              var provided = port.eContainer().getProvided().get(j);
              if (port.getPortTypeRef() == provided.getPortTypeRef()) {
                var portEntity = comp.getPort(port.getPortTypeRef().getName());
                if (portEntity != null) {
                  addPortToEditor(portEntity, comp, chan);
                }
              }
            }

            for (var j=0; j < port.eContainer().getRequired().size(); j++) {
              var required = port.eContainer().getRequired().get(j);
              if (port.getPortTypeRef() == required.getPortTypeRef()) {
                var portEntity = comp.getPort(port.getPortTypeRef().getName());
                if (portEntity != null) {
                  addPortToEditor(portEntity, comp, chan);
                }
              }
            }
          }

          function addPortToEditor(portEntity, component, chan) {
            portEntity.setComponent(component);
            portEntity._instance = port;
            var wire = portEntity.createWire();
            wire._instance = kBindings.get(i);
            wire.setTarget(chan);
            chan.addWire(wire);
          }
        }
      }
    }

    function visitNodeNetworks(editor, factory, kNets) {
      for (var i=0; i < kNets.size(); i++) {
        var initByNode = editor.getEntity(kNets.get(i).getInitBy().getName()),
          targetNode = editor.getEntity(kNets.get(i).getTarget().getName());

        if (initByNode && targetNode) {
          // check if targetNode already has a node network for this initBy node
          var nodeNetwork = getNodeNetwork(initByNode, targetNode);
          if (!nodeNetwork) {
            nodeNetwork = factory.newNodeNetwork(initByNode, targetNode);
            nodeNetwork._instance = kNets.get(i);
            targetNode.getNodeProperties().addNodeNetwork(nodeNetwork);
          }

          // create node links for targetNode if not already done
          var links = kNets.get(i).getLink();
          if (links.size() > 0) targetNode.getNodeProperties().removeAllLinks();
          for (var j=0; j < links.size(); j++) {
            var link = factory.newNodeLink(targetNode.getNodeProperties());
            link.setNetworkType(links.get(j).getNetworkType());
            link.setEstimatedRate(links.get(j).getEstimatedRate());

            // create network properties for this node link
            var props = links.get(j).getNetworkProperties();
            if (props.size() > 0) link.removeAllNetworkProperties();
            for (var k=0; k < props.size(); k++) {
              var prop = factory.newNetworkProperty(link);
              prop.setKey(props.get(k).getName());
              prop.setValue(props.get(k).getValue());
              link.addNetworkProperty(prop);
            }

            // add node link to node properties
            targetNode.getNodeProperties().addLink(link);
          }
        }
      }

      function getNodeNetwork(initBy, target) {
        var nets = target.getNodeProperties().getNodeNetworks();
        for (var i in nets) {
          if (nets[i].getInitBy().getName() == initBy.getName()
            && nets[i].getTarget().getName() == target.getName()) {
            return nets[i];
          }
        }
        return null;
      }
    }

    function loadMetaData(entity, instance) {
      var metaData = instance.getMetaData(),
        x = 100, // default x coordinate in editor panel
        y = 100; // default y coordinate in editor panel

      if (metaData != null) {
        var commaSplitted = metaData.split(',');
        for (var i=0; i < commaSplitted.length; i++) {
          if (commaSplitted[i].substr(0, 'x='.length) == 'x=') {
            x = parseInt(commaSplitted[i].substr('x='.length, commaSplitted[i].length-1));
          }

          if (commaSplitted[i].substr(0, 'y='.length) == 'y=') {
            y = parseInt(commaSplitted[i].substr('y='.length, commaSplitted[i].length-1));
          }
        }
      }

      entity.getUI().getShape().setAbsolutePosition(x, y);
    }

    function loadDictionaryValues(entity, instance, factory) {
      // add attributes to dictionaries
      var kDicType = instance.getTypeDefinition().getDictionaryType();
      if (kDicType) {
        var kAttributes = (kDicType.getAttributes()) ? kDicType.getAttributes().iterator() : null;
        if (kAttributes) {
          while (kAttributes.hasNext()) {
            var kAttr = kAttributes.next();
            var attr = factory.newAttribute();
            attr.setName(kAttr.getName());
            attr.setOptional(Util.parseBoolean(kAttr.getOptional()));
            attr.setFragmentDependant(Util.parseBoolean(kAttr.getFragmentDependant()));
            attr.setDefaultValue(kAttr.getDefaultValue());
            // TODO handle datatype/enum and stuff
            entity.addDictionaryAttribute(attr);
          }
        }
      }

      // define a function to add values to dictionaries later on
      function addValuesToDictionary(kDictionary, dictionary) {
        var values = (kDictionary.getValues()) ? kDictionary.getValues().iterator() : null;
        if (values) {
          while (values.hasNext()) {
            var kVal = values.next();
            var val = factory.newValue();
            val._instance = kVal;
            val.setName(kVal.getName());
            val.setValue(kVal.getValue());
            dictionary.addValue(val);
          }
        }
      }

      // add non fragment dependant attribute values
      var kDictionary = instance.getDictionary();
      var dictionary = factory.newDictionary(entity, false);
      if (kDictionary != null && kDictionary != undefined) {
        // use predefined function
        addValuesToDictionary(kDictionary, dictionary);
        dictionary._instance = kDictionary;
      }

      // add fragment dependant attribute values
      var kFragDictionaries = (instance.getFragmentDictionary()) ? instance.getFragmentDictionary().iterator(): null;
      if (kFragDictionaries) {
        while (kFragDictionaries.hasNext()) {
          var kFragDic = kFragDictionaries.next();
          var fragDic = factory.newFragmentDictionary(entity);
          fragDic.setName(kFragDic.getName());
          fragDic._instance = kFragDic;
          // use predefined function
          addValuesToDictionary(kFragDic, fragDic);
          entity.addFragmentDictionary(fragDic);
        }
      }
    }

    return InstanceModelVisitor;
  }
);