'use strict';

angular.module('editorApp')
  .factory('kRegistry2', function ($http, kFactory) {
    var conf = require('tiny-conf');

    function getUrl() {
      var protocol = conf.get('registry.ssl') ? 'https://' : 'http://';
      var host = conf.get('registry.host');
      var port = conf.get('registry.port');
      if (port === 80 || port === 443) {
        port = '';
      } else {
        port = ':' + port;
      }
      return protocol + host + port;
    }

    return {
      setUrl: function (url) {
        var port;
        if (url.port.length > 0) {
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
      },
      getUrl: function () {
        return getUrl();
      },
      getAll: function () {
        return $http({
            method: 'GET',
            url: getUrl() + '/api/tdefs',
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
          url: getUrl() + '/api/namespaces/' + namespace + '/tdefs/' + name + '/' + version + '/latest-dus',
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
            url: getUrl() + '/api/namespaces/' + namespace + '/tdefs/' + name + '/' + version + '/released-dus',
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
