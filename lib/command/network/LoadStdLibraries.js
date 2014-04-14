var AbstractCommand = require('../AbstractCommand'),
    LocalStorage    = require('../../util/LocalStorageHelper'),
    LSKeys          = require('../../config/local-storage-keys'),
    DefaultConf     = require('../../config/defaults');

/**
 * Created with IntelliJ IDEA.
 * User: leiko
 * Date: 21/02/14
 * Time: 12:03
 */
var LoadStdLibraries = AbstractCommand.extend({
    toString: 'LoadStdLibraries',
    
    execute: function (platform, callback) {
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
            type: 'GET',
            url: 'http://'+host+':'+port+prefix+'/load',
            timeout: 30000, // 30 seconds
            data: { platform: platform },
            dataType: 'jsonp',
            success: function (data) {
                switch (data.result) {
                    case 1:
                        // ok
                        return callback(null, data.libraries);

                    default:
                        // ko server-side
                        return callback(new Error(data.message));
                }
            },
            error: function (data) {
                return callback(new Error('Request http://'+host+':'+port+prefix+'/load '+data.statusText));
            }
        });
    }
});

module.exports = LoadStdLibraries;
