// Created by leiko on 13/10/14 17:41
var kevoree = require('kevoree-library').org.kevoree,
    Kotlin = require('kevoree-kotlin');

/**
 *
 * @param tdefSrc
 * @param platformTdef
 * @returns {string|null}
 */
var checkPlatform = function (tdefSrc, platformTdef) {
    var platform = null;

    var srcPlatforms = tdefSrc.select('deployUnits[name=*]/filters[name=platform]');
    var targetPlatforms = platformTdef.select('deployUnits[name=*]/filters[name=platform]');

    if (srcPlatforms.size() > 0 && targetPlatforms.size() > 0) {
        for (var i=0; i < targetPlatforms.size(); i++) {
            var targetPlatform = targetPlatforms.get(i).value;
            for (var j=0; j < srcPlatforms.size(); j++) {
                if (srcPlatforms.get(j).value === targetPlatform) {
                    return targetPlatform;
                }
            }
        }
    }

    return platform;
};

module.exports.checkPlatform = checkPlatform;