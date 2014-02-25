var Resolver    = require('kevoree-commons').Resolver,
    MergeLibCmd = require('../command/network/MergeLibrary');

/**
 * Created with IntelliJ IDEA.
 * User: leiko
 * Date: 24/02/14
 * Time: 13:54
 */
var NPMResolver = Resolver.extend({
    toString: 'NPMResolver',
    
    construct: function (editor) {
        this.mergeCmd = new MergeLibCmd(editor);
    },

    /**
     *
     * @param deployUnit Kevoree DeployUnit
     * @param force [optional] boolean that indicates whether or not we should force re-installation no matter what
     * @param callback(err, Class, model)
     */
    resolve: function (deployUnit, force, callback) {
        callback = callback || force;
        
        var libz = {
            javascript: [
                {
                    groupID: deployUnit.groupName,
                    artifactID: deployUnit.name,
                    version: deployUnit.version
                }
            ]
        };
        this.mergeCmd.execute(libz, function (err, model) {
            return callback(err, null, model);
        });
    },

    uninstall: function (deployUnit, force, callback) {
        // we don't really install things client-side, so
        // there is not much to do in this uninstall function.
        return callback();
    }
});

module.exports = NPMResolver;