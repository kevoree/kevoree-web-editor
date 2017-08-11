'use strict';

(function () {
  angular.module('editorApp')
    .factory('kRegistry', KevoreeRegistryService);

  KevoreeRegistryService.$inject = ['$q', 'storage', 'kFactory', 'KEVOREE_REGISTRY_URL'];

  function KevoreeRegistryService($q, storage, kFactory, KEVOREE_REGISTRY_URL) {
    var cachedUrl = null;
    var loader = kFactory.createJSONLoader();

    // INIT REGISTRY URL
    var storedUrl = storage.get('registry');
    if (storedUrl) {
      try {
        setUrl(new URL(storedUrl));
      } catch (ignore) {
        Notification.error({
          title: 'Kevoree Registry',
          message: 'Stored URL in local storage is malformed. You should update it',
          delay: 8000
        });
      }
    } else {
      setUrl(new URL(KEVOREE_REGISTRY_URL));
    }

    return {
      getUrl: getUrl,
      setUrl: setUrl,
      transformTdef: transformTdef,
      namespace: {
        all: allNamespaces
      },
      tdef: {
        getLatestsByNamespace: getLatestTdefsByNamespace,
        getAllByNamespaceAndName: getAllTdefsByNamespaceAndName,
      },
      du: {
        getReleases: getDuReleases,
        getLatests: getDuLatests,
      }
    };

    function setUrl(url) {
      var port;
      if (url.port && url.port.length > 0) {
        port = parseInt(url.port, 10);
      } else {
        if (url.protocol === 'http:') {
          port = 80;
        } else {
          port = 443;
        }
      }
      TinyConf.set('registry.host', url.hostname);
      TinyConf.set('registry.port', port);
      TinyConf.set('registry.ssl', url.protocol === 'https:');
      cachedUrl = url;
      storage.set('registry', url.toString());
    }

    function getUrl() {
      return cachedUrl;
    }

    function allNamespaces() {
      return $q.when(KevoreeRegistryClient.namespace.all());
    }

    function getLatestTdefsByNamespace(namespace) {
      return $q.when(KevoreeRegistryClient.tdef.getLatestsByNamespace(namespace))
        .then(function (tdefs) {
          tdefs.sort(function (a, b) {
            if (a.name < b.name) {
              return -1;
            }
            if (a.name > b.name) {
              return 1;
            }
            return 0;
          });
          return tdefs.map(transformTdef);
        });
    }

    function getAllTdefsByNamespaceAndName(namespace, name) {
      return $q.when(KevoreeRegistryClient.tdef.getAllByNamespaceAndName(namespace, name))
        .then(function (tdefs) {
          return tdefs.map(transformTdef);
        });
    }

    function getDuReleases(namespace, name, version) {
      return $q.when(KevoreeRegistryClient.du.getReleases(namespace, name, version))
        .then(function (dus) {
          return dus.map(transformDu);
        });
    }

    function getDuLatests(namespace, name, version) {
      return $q.when(KevoreeRegistryClient.du.getLatests(namespace, name, version))
        .then(function (dus) {
          return dus.map(transformDu);
        });
    }

    function transformTdef(tdef) {
      try {
        tdef.model = loader.loadModelFromString(tdef.model).get(0);
        tdef.type = inferType(tdef.model);
        tdef.description = getDescription(tdef.model);
      } catch (err) {
        tdef.error = 'Unable to parse model';
        tdef.type = inferTypeFromJSON(tdef.model);
        tdef.description = getDescriptionFromJSON(tdef.model);
      }
      return tdef;
    }

    function transformDu(du) {
      try {
        du.model = loader.loadModelFromString(du.model).get(0);
      } catch (err) {
        du.error = 'Unable to parse model';
      }
      return du;
    }

    function inferType(model) {
      if (model.metaClassName() === 'org.kevoree.NodeType') {
        return 'node';
      } else if (model.metaClassName() === 'org.kevoree.ComponentType') {
        return 'component';
      } else if (model.metaClassName() === 'org.kevoree.ChannelType') {
        return 'channel';
      } else if (model.metaClassName() === 'org.kevoree.GroupType') {
        return 'group';
      }
    }

    function getDescription(model) {
      var meta = model.findMetaDataByID('description');
      if (meta) {
        return meta.value;
      } else {
        return null;
      }
    }

    function inferTypeFromJSON(model) {
      if (model.class.startsWith('org.kevoree.NodeType')) {
        return 'node';
      } else if (model.class.startsWith('org.kevoree.ComponentType')) {
        return 'component';
      } else if (model.class.startsWith('org.kevoree.ChannelType')) {
        return 'channel';
      } else if (model.class.startsWith('org.kevoree.GroupType')) {
        return 'group';
      }
    }

    function getDescriptionFromJSON(model) {
      var desc = model.metaData.find(function (meta) {
        return meta.name === 'description';
      });
      return desc ? desc.value : null;
    }
  }
})();
