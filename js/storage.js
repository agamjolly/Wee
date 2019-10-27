window.helpers = {};
window.helpers.storage = function() {
    var buildKey = function(key) {
        return 'ls-' + key;
    };

    var getValue = function(key) {
        if (!localStorage) {
            return null;
        }

        var value = localStorage.getItem(buildKey(key));
        try {
            return value && JSON.parse(value);
        } catch (e) {
            return value;
        }
    };

    var setValue = function(key, value) {
        if (!localStorage) {
            return null;
        }

        try {
            if (value != null && value !== '') {
                localStorage.setItem(buildKey(key), JSON.stringify(value));
            } else {
                localStorage.removeItem(buildKey(key));
            }
        } catch (e) {
        }
    };

    return {
        getValue: getValue,
        setValue: setValue
    };
}();