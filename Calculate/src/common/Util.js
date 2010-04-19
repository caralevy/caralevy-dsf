if (typeof CalcWidget == "undefined" || !CalcWidget) {
    var CalcWidget = {};
}

if (console && console.log) {
    CalcWidget.log = function(message) {
        console.log(message);
    }
}
else if (print) {
    CalcWidget.log = function(message) {
        print(message);
    }
}
else if (alert) {
    CalcWidget.log = function(message) {
        alert(message);
    }
}
else {
    CalcWidget.log = function(message) { };
}

if (window.widget) {
    CalcWidget.setPref = function(key, value) {
        window.widget.setPreferenceForKey(value, key);
    }
    CalcWidget.pref = function(key) {
        return window.widget.preferenceForKey(key);
    }
}
else if (window.localStorage) {
    CalcWidget.setPref = function(key, value) {
        window.localStorage.setItem(key, value);
    }
    CalcWidget.pref = function(key) {
        return window.localStorage.getItem(key);
    }
}
else {
    CalcWidget.setPref = function(key, value) {
        // Do nothing
    }
    CalcWidget.pref = function(key) {
        return undefined;
    }
}

CalcWidget.valueToString = function(value) {
    if (value === undefined) {
        value = "undefined";
    }
    else if (typeof value == "number" || typeof value == "boolean") {
        value = value.toString();
    }
    else if (value instanceof Array) {
        value = CalcWidget.arrayToString(value);
    }
    else if (typeof value == "string") {
        value = "\"" + value + "\"";
    }
    else if (typeof value == "function") {
        value = value.toString();
    }
    else if (value.toString() == "[object Object]") {
        value = CalcWidget.objectToString(value);
    }
    else {
        value = "\"" + value.toString() + "\"";
    }
    return value;
};

CalcWidget.arrayToString = function(a) {
    var s = "";
    for (var i = 0; i < a.length; i++) {
        s += CalcWidget.valueToString(a[i]);
        if (i < a.length - 1) {
            s += ",";
        }
    }
    return "[" + s + "]";
};

CalcWidget.objectToString = function(obj) {
    var s = "";
    for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
            if (obj[i] !== undefined) {
                var value = CalcWidget.valueToString(obj[i]);
                s += "\"" + i + "\": " + value + ", ";
            }
        }
    }
    if (s.charAt(s.length-2) == ',') {
        s = s.substring(0, s.length-2);
    }
    return "{" + s + "}";
};

CalcWidget.isAlphaNumeric = function(ch) {
    return ((ch >= '0' && ch <= '9') || ch.toLowerCase() != ch.toUpperCase());
};

String.prototype.startsWith = function(str){
    return (this.indexOf(str) === 0);
}