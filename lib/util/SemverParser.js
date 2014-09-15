// Created by leiko on 15/09/14 16:34
var SemVer = require('semver');

/**
 *
 * @param versions
 * @returns {{latest: String, release: String}}
 */
module.exports = function (versions) {
    // convert all string version to SemVer version object
    versions = versions.map(function (v) {
        return new SemVer(v);
    });

    // sort versions array (ascending = last item is the greatest)
    versions.sort(function (a, b) {
        return SemVer.gt(a, b);
    });

    // retrieve last release version (or null if none)
    // e.g ['0.0.1', '0.0.2', '0.0.3-alpha'] => '0.0.2'
    function getLatestRelease(vers) {
        var v = vers.pop();
        while (typeof (v) !== 'undefined') {
            if (v.prerelease.length === 0) {
                return v.raw;
            }
            v = vers.pop();
        }
    }

    return {
        latest: versions[versions.length-1].raw,
        release: getLatestRelease(versions.slice())
    };
};