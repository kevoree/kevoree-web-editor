define(
  [
    'control/CEditor',
    'control/CGroup',
    'control/CChannel',
    'control/CNode',
    'control/CComponent',
    'control/CWire',
    'control/CInputPort',
    'control/COutputPort',
    'control/property/CNodeNetwork',
    'control/property/CNodeLink',
    'control/property/CNetworkProperty',
    'control/property/CNodeProperties',
    'control/dictionary/CDictionary',
    'control/dictionary/CAttribute',
    'control/dictionary/CValue'
  ],

  function (CEditor, CGroup, CChannel, CNode, CComponent, CWire, CInputPort, COutputPort, CNodeNetwork, CNodeLink,
            CNetworkProperty, CNodeProperties, CDictionary, CAttribute, CValue) {

    /**
     *
     * @returns {CFactory}
     * @constructor
     */
    function CFactory() {
      if (CFactory.prototype._instance) {
        return CFactory._instance;
      }
      CFactory._instance = this;

      return CFactory._instance;
    }

    /**
     *
     * @returns {CFactory}
     */
    CFactory.getInstance = function() {
      if (!CFactory._instance) {
        return new CFactory();
      }
      return CFactory._instance;
    }

    /**
     *
     * @param containerID
     * @returns {control.CEditor}
     */
    CFactory.prototype.newEditor = function (containerID) {
      return new CEditor(containerID);
    };

    /**
     *
     * @param editor
     * @param type
     * @param version
     * @returns {control.CGroup}
     */
    CFactory.prototype.newGroup = function (editor, type, version) {
      return new CGroup(editor, type, version);
    };

    /**
     *
     * @param editor
     * @param type
     * @param version
     * @returns {control.CNode}
     */
    CFactory.prototype.newNode = function (editor, type, version) {
      return new CNode(editor, type, version);
    };

    /**
     *
     * @param editor
     * @param type
     * @param version
     * @returns {control.CComponent}
     */
    CFactory.prototype.newComponent = function (editor, type, version) {
      return new CComponent(editor, type, version);
    };

    /**
     *
     * @param editor
     * @param type
     * @param version
     * @returns {control.CChannel}
     */
    CFactory.prototype.newChannel = function (editor, type, version) {
      return new CChannel(editor, type, version);
    };

    /**
     *
     * @param origin
     * @returns {control.CWire}
     */
    CFactory.prototype.newWire = function (origin) {
      return new CWire(origin);
    };

    /**
     *
     * @param name
     * @returns {control.CInputPort}
     */
    CFactory.prototype.newInputPort = function (name) {
      return new CInputPort(name);
    };

    /**
     *
     * @param name
     * @returns {control.COutputPort}
     */
    CFactory.prototype.newOutputPort = function (name) {
      return new COutputPort(name);
    };

    /**
     *
     * @param name
     * @returns {control.COutputPort}
     */
    CFactory.prototype.newOutputPort = function (name) {
      return new COutputPort(name);
    };

    /**
     *
     * @param initBy
     * @param target
     * @returns {control.property.CNodeNetwork}
     */
    CFactory.prototype.newNodeNetwork = function (initBy, target) {
      return new CNodeNetwork(initBy, target);
    };

    /**
     *
     * @param nodeProps
     * @returns {control.property.CNodeLink}
     */
    CFactory.prototype.newNodeLink = function (nodeProps) {
      return new CNodeLink(nodeProps);
    };

    /**
     *
     * @param link
     * @returns {control.property.CNetworkProperty}
     */
    CFactory.prototype.newNetworkProperty = function (link) {
      return new CNetworkProperty(link);
    };

    /**
     *
     * @param node
     * @returns {control.property.CNodeProperties}
     */
    CFactory.prototype.newNodeProperties = function (node) {
      return new CNodeProperties(node);
    };

    /**
     *
     * @param entity
     * @param isFragment
     * @returns {control.dictionary.CDictionary}
     */
    CFactory.prototype.newDictionary = function (entity, isFragment) {
      isFragment = isFragment || false;
      return new CDictionary(entity, isFragment);
    };

    /**
     * Alias method for CFactory.newDictionary(entity, true)
     * @param entity
     * @returns {control.dictionary.CDictionary}
     */
    CFactory.prototype.newFragmentDictionary = function (entity) {
      return new CDictionary(entity, true);
    };

    /**
     *
     * @returns {control.dictionary.CAttribute}
     */
    CFactory.prototype.newAttribute = function () {
      return new CAttribute();
    };

    /**
     *
     * @returns {control.dictionary.CValue}
     */
    CFactory.prototype.newValue = function () {
      return new CValue();
    };

    return CFactory;
  }
);