/**
 * Created with IntelliJ IDEA.
 * User: leiko
 * Date: 21/02/14
 * Time: 11:13
 */
module.exports = {
    /**
     * 
     * @param key
     * @param [defaultVal]
     * @returns {*}
     */
    get: function (key, defaultVal) {
        if (window.localStorage) {
            var val = window.localStorage.getItem(key);
            if (val === null) {
                return defaultVal;
            } else if (val === 'false') {
                return false;
            } else if (val === 'true') {
                return true;
            } else {
                return val;
            }
        }
        return defaultVal;
    },
    
    /**
     * 
     * @param key
     * @param value
     */
    set: function (key, value) {
        if (window.localStorage) {
            window.localStorage.setItem(key, value);
        }
    }
};
