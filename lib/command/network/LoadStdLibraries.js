var AbstractCommand = require('../AbstractCommand'),
    kevoree         = require('kevoree-library').org.kevoree,
    registry        = require('kevoree-registry-client'),
    SemverParser    = require('../../util/SemverParser'),
    SemVer          = require('semver');

var factory = new kevoree.factory.DefaultKevoreeFactory();

/**
 * Created with IntelliJ IDEA.
 * User: leiko
 * Date: 21/02/14
 * Time: 12:03
 */
var LoadStdLibraries = AbstractCommand.extend({
    toString: 'LoadStdLibraries',
    
    execute: function (platform, callback) {
        if (platform === 'javascript') { platform = 'js'; }
        registry.get({fqn: 'org.kevoree.library.'+platform, parse: false}, function (err, model) {
            if (err) {
                callback(err);
            } else {
                var loader = factory.createJSONLoader();
                try {
                    model = loader.loadModelFromString(model).get(0);
                    var dus = model.select('packages[org]/packages[kevoree]/packages[library]/packages['+platform+']/deployUnits[name=*]').array;
                    var libs = {};
                    dus.forEach(function (du) {
                        var lib = libs[du.name] || {};
                        lib.name = (function () {
                            if (platform === 'js') {
                                var tmp = du.name.split('-');
                                tmp.shift();
                                lib.type = tmp.shift();
                                return tmp.join('-');
                            } else {
                                return du.name.split('.').pop();
                            }
                        })();
                        lib.versions = lib.versions || [];
                        lib.versions.push(du.version);
                        lib.path = du.path();
                        libs[du.name] = lib;
                    });

                    var res = [];
                    for (var lib in libs) {
                        if (libs.hasOwnProperty(lib)) {
                            var parsedVersions = SemverParser(libs[lib].versions);
                            libs[lib].latest = parsedVersions.latest;
                            libs[lib].release = parsedVersions.release;
                            res.push(libs[lib]);
                        }
                    }

                    // ascending alphabetical sort
                    res.sort(function (a, b) {
                        return a.name.localeCompare(b.name);
                    });

                    callback(null, res);
                } catch (err) {
                    callback(err);
                }
            }
        });
    }
});

module.exports = LoadStdLibraries;
