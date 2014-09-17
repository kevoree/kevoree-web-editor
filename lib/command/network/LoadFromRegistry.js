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
//        var path = 'packages[' + fqn.replace(/\./g, ']/packages[') + ']/**/typeDefinitions[name=*]';

        registry.get({fqn: fqn, parse: false}, function (err, model) {
            if (err) {
                callback(err);
            } else {
                try {
                    var loader = factory.createJSONLoader();
                    model = loader.loadModelFromString(model).get(0);
                    var libraries = [],
                        tdefsMap = {};

                    var tdefs = model.select('**/typeDefinitions[name=*]');
                    tdefs.array.forEach(function (tdef) {
                        var item = tdefsMap[tdef.name] || {};
                        item.versions = item.versions || [];
                        item.versions.push(tdef.version);
                        tdefsMap[tdef.name] = item;
                    });

                    for (var name in tdefsMap) {
                        if (tdefsMap.hasOwnProperty(name)) {
                            var parsedVersions = SemverParser(tdefsMap[name].versions);
                            tdefsMap[name].latest = parsedVersions.latest;
                            tdefsMap[name].release = parsedVersions.release;
                        }
                    }

                    tdefs.array.forEach(function (tdef) {
                        libraries.push({
                            path: tdef.path(),
                            version: tdef.version,
                            type: ModelHelper.findTypeDefinitionType(tdef),
                            name : tdef.name,
                            isRelease: (tdefsMap[tdef.name].release === tdef.version),
                            isLatest: (tdefsMap[tdef.name].latest === tdef.version)
                        });
                    });

                    libraries.sort(function (a, b) {
                        return a.name.localeCompare(b.name);
                    });

                    callback(null, libraries, model);
                } catch (err) {
                    callback(err);
                }
            }
        });
    }
});

module.exports = LoadFromRegistry;
