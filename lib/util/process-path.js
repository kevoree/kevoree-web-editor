/**
 * Created by leiko on 22/04/14.
 */
module.exports = function (path) {
    if (path) {
        if (path.startsWith('/')) {
            return path;
        } else {
            return '/' + path;
        }
    }
    return '';
};