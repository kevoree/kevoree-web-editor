'use strict';

angular.module('editorApp')
  .factory('kRegistry', function ($http, kFactory, storage, KEVOREE_REGISTRY_URL) {
    var conf = require('tiny-conf');
    var cachedUrl;

    function setUrl(url) {
      var port;
      if (url.port && url.port.length > 0) {
        port = parseInt(url.port);
      } else {
        if (url.protocol === 'http:') {
          port = 80;
        } else {
          port = 443;
        }
      }
      conf.set('registry.host', url.hostname);
      conf.set('registry.port', port);
      conf.set('registry.ssl', url.protocol === 'https:');
      cachedUrl = url;
      storage.set('registry', url.toString());
    }

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
      hasUrl: function () {
        return cachedUrl !== undefined;
      },
      setUrl: function (url) {
        setUrl(url);
      },
      getUrl: function () {
        return cachedUrl;
      },
      getAll: function () {
        return $http({
            method: 'GET',
            url: cachedUrl.toString() + 'api/tdefs',
            headers: {
              'Accept': 'application/json'
            }
          })
          .then(function (res) {
            var tdefs = {};
            res.data.forEach(function (tdef) {
              tdef.model = kFactory.createJSONLoader().loadModelFromString(tdef.model).get(0);
              var desc = tdef.model.findMetaDataByID('description');
              if (desc) {
                tdef.description = desc.value;
              }
              var entry = tdefs[tdef.namespace.name+'_'+tdef.name];
              if (!entry) {
                entry = {
                  name: tdef.name,
                  type: tdef.model.metaClassName(),
                  namespace: tdef.namespace,
                  versions: []
                };
                tdefs[tdef.namespace.name+'_'+tdef.name] = entry;
              }
              entry.versions.push({
                id: tdef.id,
                version: tdef.version,
                deployUnits: tdef.deployUnits,
                model: tdef.model,
                description: tdef.description
              });
            });
            return Object.keys(tdefs).map(function (key) {
              return tdefs[key];
            });
          });
      },
      addDeployUnits: function (namespace, name, version, elem) {
        $http({
          method: 'GET',
          url: cachedUrl.toString() + 'api/namespaces/' + namespace + '/tdefs/' + name + '/' + version + '/latest-dus',
          headers: {
            'Accept': 'application/json'
          }
        })
        .then(function (res) {
          elem.latestDus = res.data.map(function (du) {
            du.model = kFactory.createJSONLoader().loadModelFromString(du.model).get(0);
            return du;
          });
          $http({
            method: 'GET',
            url: cachedUrl.toString() + 'api/namespaces/' + namespace + '/tdefs/' + name + '/' + version + '/released-dus',
            headers: {
              'Accept': 'application/json'
            }
          })
          .then(function (res) {
            elem.releaseDus = res.data.map(function (du) {
              du.model = kFactory.createJSONLoader().loadModelFromString(du.model).get(0);
              return du;
            });
          });
        });
      }
    };
  });
