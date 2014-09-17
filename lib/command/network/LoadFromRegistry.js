var AbstractCommand = require('../AbstractCommand'),
    kevoree         = require('kevoree-library').org.kevoree,
    registry        = require('kevoree-registry-client'),
    SemverParser    = require('../../util/SemverParser'),
    ModelHelper     = require('../../util/ModelHelper'),
    SemVer          = require('semver');

var factory = new kevoree.factory.DefaultKevoreeFactory();

/**
 * Created with IntelliJ IDEA.
 * User: leiko
 * Date: 21/02/14
 * Time: 12:03
 */
var LoadFromRegistry = AbstractCommand.extend({
    toString: 'LoadFromRegistry',

    /**
     *
     * @param fqn
     * @param callback
     */
    execute: function (fqn, callback) {
        var path = 'packages[' + fqn.replace(/\./g, ']/packages[') + ']/**/typeDefinitions[name=*]';

        registry.get({fqn: fqn, parse: false}, function (err, model) {
            if (err) {
                callback(err);
            } else {
                var loader = factory.createJSONLoader();
                try {
                    model = loader.loadModelFromString(model).get(0);
                    var tdefs = model.select(path).array;
                    var map = {};
                    tdefs.forEach(function (tdef) {
                        var lib = map[tdef.name] || {};
                        lib.name = tdef.name;
                        lib.versions = lib.versions || [];
                        lib.versions.push(tdef.version);
                        lib.path = tdef.path();
                        lib.type = ModelHelper.findTypeDefinitionType(tdef);
                        map[tdef.name] = lib;
                    });

                    var res = [];
                    for (var key in map) {
                        if (map.hasOwnProperty(key)) {
                            var parsedVersions = SemverParser(map[key].versions);
                            map[key].latest = parsedVersions.latest;
                            map[key].release = parsedVersions.release;
                            res.push(map[key]);
                        }
                    }

                    // ascending alphabetical sort
                    res.sort(function (a, b) {
                        return a.name.localeCompare(b.name);
                    });

                    callback(null, res, model);
                } catch (err) {
                    callback(err);
                }
            }
        });
    }
});

module.exports = LoadFromRegistry;
