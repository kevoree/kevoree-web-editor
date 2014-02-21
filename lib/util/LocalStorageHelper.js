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
     * @returns {*}
     */
    get: function (key) {
        if (window.localStorage) {
            return window.localStorage.getItem(key);
        }
        return null;
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
}
