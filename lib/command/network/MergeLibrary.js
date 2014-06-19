var AbstractCommand = require('../AbstractCommand'),
    LocalStorage    = require('../../util/LocalStorageHelper'),
    LSKeys          = require('../../config/local-storage-keys'),
    DefaultConf     = require('../../config/defaults'),
    kevoree         = require('kevoree-library').org.kevoree;

var loader = new kevoree.loader.JSONModelLoader();

/**
 * Created with IntelliJ IDEA.
 * User: leiko
 * Date: 21/02/14
 * Time: 12:03
 */
var MergeLibrary = AbstractCommand.extend({
    toString: 'MergeLibrary',
    
    execute: function (libz, repos, callback) {
        if (!callback && typeof (repos) == 'function') {
            callback = repos;
            repos = [];
        }
        if (!repos) {
            repos = [];
        }

        var host    = LocalStorage.get(LSKeys.HOST, DefaultConf.HOST),
            port    = LocalStorage.get(LSKeys.PORT, DefaultConf.PORT),
            prefix  = LocalStorage.get(LSKeys.PREFIX, DefaultConf.PREFIX);

        if (prefix) {
            if (prefix.endsWith('/')) {
                prefix = prefix.substr(0, prefix.length - 1);
            }
        } else {
            prefix = '';
        }

        $.ajax({
            type: 'POST',
            url: 'http://'+host+':'+port+prefix+'/merge',
            timeout: 1000*60*2, // 2 minutes
            data: {
                libz: libz,
                repos: repos
            },
            dataType: 'jsonp',
            success: function (data) {
                switch (data.result) {
                    case 1:
                        // ok
                        var model = loader.loadModelFromString(JSON.stringify(data.model)).get(0);
                        return callback(null, model);
                    
                    default:
                        // ko server-side
                        return callback(new Error(data.message));
                }
            },
            error: function (data) {
                return callback(new Error('Request http://'+host+':'+port+prefix+'/merge '+data.statusText));
            }
        });
    }
});

module.exports = MergeLibrary;
