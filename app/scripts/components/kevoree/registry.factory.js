'use strict';

angular.module('editorApp')
  .factory('kRegistry', function($http, $q, storage, kFactory, kModelHelper, Notification, KEVOREE_REGISTRY_URL) {
    var KEY_REG_LIBS = 'registry_libraries',
      KEY_REG_MODEL = 'registry_model',
      KEY_REG_UPDATE = 'registry_update',
      KEY_REG = 'registry';
    var model, tdefs, initiated, takeFromStorage, listener;
    var url = storage.get(KEY_REG, KEVOREE_REGISTRY_URL);

    function clean() {
      model = null;
      tdefs = {
        groups: {},
        nodes: {},
        channels: {},
        components: {},
        getAll: function() {
          return [].concat(tdefs.groups)
            .concat(tdefs.nodes)
            .concat(tdefs.channels)
            .concat(tdefs.components);
        }
      };
      initiated = false;
      takeFromStorage = false;
    }

    /**
     * Returns a Promise with the Registry root model
     * @returns {*}
     */
    function getAll() {
      return $q(function(resolve, reject) {
        if (model) {
          resolve(model);
        } else {
          $http({
              method: 'GET',
              url: url + '/_/timestamp',
              headers: {
                'Accept': 'application/json'
              }
            })
            .then(function(res) {
              var timestamp = res.data.value;
              var lastUpdate = storage.get(KEY_REG_UPDATE, 0);
              if (timestamp > lastUpdate) {
                $http({
                    method: 'GET',
                    url: url,
                    headers: {
                      'Accept': 'application/json'
                    }
                  })
                  .then(function(res) {
                    try {
                      var modelStr = JSON.stringify(res.data);
                      takeFromStorage = false;
                      storage.set(KEY_REG_MODEL, modelStr);
                      var loader = kFactory.createJSONLoader();
                      model = loader.loadModelFromString(modelStr)
                        .get(0);
                      storage.set(KEY_REG_UPDATE, timestamp);
                      resolve(model);
                    } catch (err) {
                      console.log('error', err.message);
                      reject(new Error('Unable to load Kevoree Registry model'));
                    }
                  });
              } else {
                takeFromStorage = true;
                resolve();
              }
            })
            .catch(function(res) {
              clean();
              storage.remove(KEY_REG_LIBS);
              storage.remove(KEY_REG_MODEL);
              storage.remove(KEY_REG_UPDATE);
              reject(new Error('Unable to retrieve content from Kevoree Registry (' + res.config.url + ')'));
            });
        }
      });
    }

    function init() {
      if (initiated) {
        return $q(function(resolve) {
          resolve(tdefs);
        });
      } else {
        return getAll()
          .then(function(model) {
            if (takeFromStorage) {
              tdefs = storage.get(KEY_REG_LIBS);
              tdefs.getAll = function() {
                return [].concat(tdefs.groups)
                  .concat(tdefs.nodes)
                  .concat(tdefs.channels)
                  .concat(tdefs.components);
              };
            } else {
              // first init the different TypeDefinition items
              model.select('**/typeDefinitions[*]')
                .array.forEach(function(tdef) {
                  var pkgFqn = kModelHelper.genPkgName(tdef.eContainer()),
                    key = btoa(pkgFqn + '_' + tdef.name),
                    descMeta = tdef.findMetaDataByID('description'),
                    desc = descMeta ? descMeta.value : null;

                  tdefs[kModelHelper.getTypeDefinitionType(tdef) + 's'][key] = {
                    package: pkgFqn,
                    name: tdef.name,
                    platforms: [],
                    versions: [],
                    selected: false,
                    uiOpen: true,
                    description: desc
                  };
                });

              // then do some process over it
							['groups', 'nodes', 'components', 'channels'].forEach(function(type) {
                tdefs[type] = Object.keys(tdefs[type])
                  .map(function(key) {
                    var siblings = model.select(kModelHelper.pkgFqnToPath(tdefs[type][key].package) + '/typeDefinitions[name=' + tdefs[type][key].name + ']'),
                      release = kModelHelper.getLatestRelease(siblings.array),
                      snapshot = kModelHelper.getLatestSnapshot(siblings.array);

                    tdefs[type][key].release = release ? release.version : null;
                    tdefs[type][key].snapshot = snapshot ? snapshot.version : null;

                    if (tdefs[type][key].release) {
                      tdefs[type][key].version = release.version;
                    } else if (tdefs[type][key].snapshot) {
                      tdefs[type][key].version = snapshot.version;
                    } else {
                      tdefs[type][key].version = null;
                    }

                    if (release) {
                      tdefs[type][key].platforms = kModelHelper.getPlatforms(release);
                    } else if (snapshot) {
                      tdefs[type][key].platforms = kModelHelper.getPlatforms(snapshot);
                    }

                    siblings.array.forEach(function(tdef) {
                      if (tdefs[type][key].versions.indexOf(tdef.version) === -1) {
                        tdefs[type][key].versions.push(tdef.version);
                      }
                    });

                    return tdefs[type][key];
                  });
              });
              storage.set(KEY_REG_LIBS, tdefs);
            }

            initiated = true;
            return tdefs;
          });
      }
    }

    /**
     * Returns a Promise with the requested model if any
     * @param path a Kevoree Modeling Framework path (eg. /foo[*]/bar[*])
     * @returns {*}
     */
    function get(path) {
      return $q(function(resolve, reject) {
        $http({
            method: 'POST',
            url: url,
            headers: {
              'Content-Type': 'text/plain'
            },
            data: [path]
          })
          .then(function(res) {
            try {
              var modelStr = JSON.stringify(res.data);
              var loader = kFactory.createJSONLoader();
              resolve(loader.loadModelFromString(modelStr)
                .get(0));
            } catch (err) {
              console.log('error', err.message);
              reject(new Error('Unable to load Kevoree Registry model for "' + path + '"'));
            }
          })
          .catch(function() {
            clean();
            storage.remove(KEY_REG_LIBS);
            storage.remove(KEY_REG_MODEL);
            storage.remove(KEY_REG_UPDATE);
            reject(new Error('Unable to retrieve content from Kevoree Registry (' + url + ')'));
          });
      });
    }

    /**
     * Saves current tdefs state to storage
     */
    function save() {
      storage.set(KEY_REG_LIBS, tdefs);
    }

    function isInit() {
      var model = storage.get(KEY_REG_MODEL);
      return model ? model.length > 0 : false;
    }

    function clearCache() {
      clean();
      storage.remove(KEY_REG_LIBS);
      storage.remove(KEY_REG_MODEL);
      storage.remove(KEY_REG_UPDATE);
      Notification.success({
        title: 'Registry Libraries cache',
        message: 'Cleared successfully',
        delay: 3000
      });
    }

    // generate a brand new tdefs list
    clean();

    return {
      init: init,
      get: get,
      save: save,
      isInit: isInit,
      clearCache: clearCache,
      getUrl: function() {
        return url;
      },
      setUrl: function(newUrl) {
        url = newUrl;
        storage.set(KEY_REG, url);
        clearCache();
        if (listener && typeof listener === 'function') {
          listener();
        }
      },
      onUrlChange: function(handler) {
        listener = handler;
      }
    };
  });
