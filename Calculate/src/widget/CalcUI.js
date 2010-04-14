//var CalcWidget = window.CalcWidget || { };

CalcWidget.UI = (function() {

    // Private variables
    var defaultText = "1+1";
    var maxOutputLines = 100;
    //var minWidth = 280; // Try with Number.MAX_VALUE
    //var minHeight = 135;
    var minWidth = 320;
    var minHeight = 160;
    var growboxInset;
    var scrollArea;
    var even = true;
    var nextID = 0;
    var firstMouseUp = true;
    var autoCompleteTimerID = null;
    var completions = null;
    var completionWordStart = 0;
    var autocompletion = false; // If false, tab-completion
    var firstKey = true;

    function isUnicode() {
        try {
            eval("var \u03c0 = Math.PI");
            return true;
        }
        catch (ex) {
            return false;
        }
    }

    // Help text
    var helpHTML =
        '<b>Calculate</b> is a math expression calculator with persistent memory ' +
        'for variables and functions. Nearly any JavaScript expression can be evaluated.' +

        '<div class="helpHeader">Samples</div>' +
        '<div class="input">2+2</div>' +
        '<div class="answer">4</div>' +
        '<div class="input">2^8</div>' +
        '<div class="answer">256</div>' +
        '<div class="input">5!</div>' +
        '<div class="answer">120</div>' +
        '<div class="input">(1+sqrt(5))/2</div>' +
        '<div class="answer">1.618033988749895</div>' +
        '<div class="input">r=1/2</div>' +
        '<div class="answer">0.5</div>' +
        '<div class="input">2*' + (isUnicode()?"&#960;":"pi") + '*r</div>' +
        '<div class="answer">3.141592653589793</div>' +
        '<div class="input">cos(answer)</div>' +
        '<div class="answer">-1</div>' +
        '<div class="input">sqr = function(x) { return x*x }</div>' +
        '<div class="answer">Function defined</div>' +
        '<div class="input">sqr(3)</div>' +
        '<div class="answer">9</div>' +

        '<div class="helpHeader">Constants</div>' +
        (isUnicode()?"&#960;, ":"") +
        "pi, e" +

        '<div class="helpHeader">Basic functions</div>' +
        "sqrt pow abs round floor ceil min max random" +

        '<div class="helpHeader">Log functions</div>' +
        "exp ln log2 log10" +

        '<div class="helpHeader">Trig functions</div>' +
        "sin cos tan csc sec cot<br/>" +
        "asin acos atan atan2 acsc asec acot" +

        '<div class="helpHeader">Hyperbolic functions</div>' +
        "sinh cosh tanh csch sech coth<br/>" +
        "asinh acosh atanh acsch asech acoth" +

        '<div class="helpHeader">More info</div>' +
        '<ul>' +
        '<li>Typing an operator (+, -, *, /, %) on an empty line automatically inserts ' +
        '"answer" before it. So typing "+1" expands to "answer+1".</li>' +
        '<li>Click the <b>C</b> button to clear the output window.</li>' +
        '<li>Click the <b>M</b> button to view the list of all constants, ' +
            'variables, and functions.</li>' +
        '<li>To delete a variable or function by name, enter "delete <i>name</i>".</li>' +
        '</ul>' +

        '<div class="helpHeader">Shortcuts</div>' +
        '<table>' +
        '<tr><td>Up/Down</td><td>Browse history</td></tr>' +
        '<tr><td>Tab</td><td>Show autocompletions (type the first few letters of a ' +
        'variable name or function name, then press Tab)</td></tr>' +
                '<tr><td>&#x2318;C</td><td>Copy last answer</td></tr>' +
        '<tr><td>&#x2318;K</td><td>Clear output window</td></tr>' +
        '<tr><td>&#x2318;M</td><td>Show memory</td></tr>' +
        '<tr><td>&#x2318;Up</td><td>Scroll up</td></tr>' +
        '<tr><td>&#x2318;Down</td><td>Scroll down</td></tr>' +
        '</table>';

    // Private methods


    function scrollToEnd() {
        var output = document.getElementById('output');
        scrollArea.verticalScrollTo(output.scrollHeight);
        scrollArea.refresh();
    }

    function scrollTo(element) {
        scrollArea.reveal(element);
        scrollArea.refresh();
    }

    function outputHTML(html) {
        var output = document.getElementById('output');
        var id = "output" + nextID;

        output.innerHTML +=
            '<div id="' + id + '" class="' + (even?'even':'odd') + '">' +
            html + '</div>';
        even = !even;
        nextID++;

        // Trim output
        while (output.childNodes.length > maxOutputLines) {
            var node = output.childNodes[0];
            output.removeChild(node);
        }

        // Scroll to output
        scrollArea.refresh();
        scrollTo(document.getElementById(id));
    }


    // Public methods

    return {

        setAutocompletion: function(a) {
            // Is 'a' boolean?
            //autocompletion = a ? true : false;
            //if (window.widget) {
            //    window.widget.setPreferenceForKey(a?"1":"0", "autocompletion");
            //}
        },

        setAngleMode: function(v) {
            CalcWidget.Math._angle = (v==0)?1:(Math.PI/180);
            if (window.widget) {
                window.widget.setPreferenceForKey(v, "anglemode");
            }
        },

        onLoad: function() {
            // Load autocompletion option
            //autocompletion = true;
            //if (window.widget) {
            //    var a = window.widget.preferenceForKey("autocompletion");
            //    if (a != undefined && a.length > 0) {
            //        autocompletion = (a == "1");
            //    }
            //}
            //
            //document.getElementById('autocompletion').checked = (autocompletion?"checked":"");
            //document.getElementById('tabcompletion').checked = (autocompletion?"":"checked");

            // Load angle mode option
            if (window.widget) {
                var v = window.widget.preferenceForKey("anglemode");
                if (v !== undefined && v.length > 0) {
                    CalcWidget.Math._angle = (v==0)?1:(Math.PI/180);
                    document.getElementById('anglemode').value = v;
                }

                // Restore dimensions
                var width = window.widget.preferenceForKey("width");
                var height = window.widget.preferenceForKey("height");
                if (width && height) {
                    window.window.resizeTo(width, height);
                }
            }

            // UI Set up
            var scrollbar = new AppleVerticalScrollbar(document.getElementById("scrollBar"));
            scrollArea = new AppleScrollArea(document.getElementById("scrollArea"), scrollbar);
            scrollArea.scrollsHorizontally = false;
            scrollArea.singlepressScrollPixels = 25;

            firstMouseUp = true;

            document.addEventListener("mouseup", function(event) {
                if (window.getSelection() == "") {
                    var edit = document.getElementById('edit');
                    edit.focus();
                    if (firstMouseUp) {
                        firstMouseUp = false;
                        edit.select();
                    }
                }
            }, true);

            window.onfocus = function () {scrollArea.focus();};
            window.onblur = function () {scrollArea.blur();};

            if (window.widget) {
                window.widget.onhide = function() {CalcWidget.Calc.saveUserVars();};

                // Removed - keep vars in case of widget upgrade.
                //widget.onremove = function() { CalcWidget.Calc.clearUserVars(); CalcWidget.Calc.clearHistory(); }
                window.widget.onremove = function() {CalcWidget.Calc.saveUserVars();};
            }

            // Info button
            var flipElement = document.getElementById("info-button");
            if (!flipElement.loaded) {
                flipElement.loaded = true;
                flipElement.object = new AppleInfoButton(flipElement,
                    document.getElementById("front"),
                    "white", "white", CalcWidget.UI.showBack);
            }

            // Done button
            var doneElement = document.getElementById("done-button");
            new AppleGlassButton(doneElement, "Done", CalcWidget.UI.showFront);

            scrollArea.refresh();
            var edit = document.getElementById('edit');
            edit.value = defaultText;
            edit.focus();
            edit.select();
                        
            edit.onbeforecopy = function(event) {
                var selection = window.getSelection().toString();
                if (selection.length == 0) {
                    // If the Dashboard isn't the clipboard owner,
                    // and the selection is empty, setting the clipboard data will fail.
                    // HACK: force a selection.
                    var edit = document.getElementById("edit");
                    edit.value += "\t";
                    edit.setSelectionRange(edit.value.length - 1, edit.value.length);
                }
            }

            edit.oncopy = function(event) {

                // If the selection is empty, copy the last answer to the clipboard
                var lastAnswer = CalcWidget.Calc.getLastAnswer().toString();
                var selection = window.getSelection().toString();
                if (selection == "\t") {

                    var edit = document.getElementById("edit");
                    if (edit.value.length > 0 && edit.value.charAt(edit.value.length - 1) == "\t") {
                        edit.value = edit.value.substring(0, edit.value.length - 1);
                    }

                    event.clipboardData.setData("Text", lastAnswer);
                    event.preventDefault();
                    event.stopPropagation();
                }
            };
        },

        showBack: function() {
            var front = document.getElementById("front");
            var back = document.getElementById("back");

            if (window.widget) {
                window.widget.prepareForTransition("ToBack");
            }

            front.style.display = "none";
            back.style.display = "block";

            if (window.widget) {
                setTimeout("window.widget.performTransition();", 0);
            }
        },

        showFront: function() {
            var front = document.getElementById("front");
            var back = document.getElementById("back");

            if (window.widget) {
                window.widget.prepareForTransition("ToFront");
            }

            front.style.display="block";
            back.style.display="none";

            if (window.widget) {
                window.setTimeout("window.widget.performTransition();", 0);
            }
            var edit = document.getElementById('edit');
            edit.focus();
        },

        clearOutput: function() {
            var output = document.getElementById('output');
            output.innerHTML = "";
            even = true;
            scrollArea.refresh();
        },

        showHelp: function() {
            outputHTML('<div class="help">' + helpHTML + '</div>');
        },

        showMemory: function() {
            var userVars = CalcWidget.Calc.getUserVars();
            var html =
                (isUnicode() ? '<div class="memory"><b>&#960;</b> = ' + Math.PI + "</div>" : '') +
                '<div class="memory"><b>pi</b> = ' + Math.PI + "</div>" +
                '<div class="memory"><b>e</b> = ' + Math.E + "</div>" +
                '<div class="memory"><b>answer</b> = ' + CalcWidget.Calc.getLastAnswer() + "</div>";

            for (var i in userVars) {
                if (userVars.hasOwnProperty(i)) {
                    var name = userVars[i];
                                        var value = window[name];
                                        if (typeof window[name] != "function") {
                                            value = CalcWidget.valueToString(window[name]);
                                        }
                    html += '<div class="memory"><b>' + name + "</b> = " + value + "</div>";
                }
            }

            outputHTML('<div class="help">' + html + '</div>');
        },

        clearMemory: function() {
            CalcWidget.Calc.clearUserVars();
            CalcWidget.Calc.clearHistory();

            var html = "Memory Cleared";
            outputHTML('<div class="help">' + html + '</div>');
        },

        focusTextField: function() {
            var edit = document.getElementById('edit');
            edit.focus();
        },

        resizeStart: function(event) {
            document.addEventListener("mousemove", CalcWidget.UI.resize, true);
            document.addEventListener("mouseup", CalcWidget.UI.resizeEnd, true);

            growboxInset = {x:(window.innerWidth - event.x), y:(window.innerHeight - event.y)};

            event.stopPropagation();
            event.preventDefault();
        },

        resize: function(event) {
            var width = Math.max(minWidth, event.x + growboxInset.x);
            var height = Math.max(minHeight, event.y + growboxInset.y);

            window.resizeTo(width, height);
            scrollToEnd();

            event.stopPropagation();
            event.preventDefault();
        },

        resizeEnd: function(event) {
            document.removeEventListener("mousemove", CalcWidget.UI.resize, true);
            document.removeEventListener("mouseup", CalcWidget.UI.resizeEnd, true);

            CalcWidget.UI.focusTextField();

            event.stopPropagation();
            event.preventDefault();

            // Save size
            if (window.widget) {
                window.widget.setPreferenceForKey(window.innerWidth, "width");
                window.widget.setPreferenceForKey(window.innerHeight, "height");
            }
        },

        keyDown: function(event) {
            // Clear key - for some reason it doesn't get sent to keyRepeat()
            if (event.keyCode == 12) {
                var edit = document.getElementById('edit');
                edit.value = "";
                firstKey = true;

                // Hack: copy-n-pasted code
                if (autoCompleteTimerID !== null) {
                    clearTimeout(autoCompleteTimerID);
                    autoCompleteTimerID = null;
                }

                completions = null;
            }
        },

        keyRepeat: function(event) {
            var tab = "U+0009";
            var edit = document.getElementById('edit');
            var ch = String.fromCharCode(event.charCode);
            var hadCompletions = (completions !== null);

            if (autoCompleteTimerID !== null) {
                clearTimeout(autoCompleteTimerID);
                autoCompleteTimerID = null;
            }

            if (event.keyIdentifier != tab) {
                completions = null;
            }

            // History browsing
            if (!event.metaKey && event.keyIdentifier == "Up") {
                var prev = CalcWidget.Calc.getHistoryPrev();
                if (prev !== null) {
                    edit.value = prev;
                    edit.selectionStart = edit.value.length;
                }
            }
            else if (!event.metaKey && event.keyIdentifier == "Down") {
                var next = CalcWidget.Calc.getHistoryNext();
                edit.value = next;
                edit.selectionStart = edit.value.length;
            }

            // Scrolling
            else if (event.metaKey && event.keyIdentifier == "Up") {
                scrollArea.scrollUp();
            }
            else if (event.metaKey && event.keyIdentifier == "Down") {
                scrollArea.scrollDown();
            }
            else if (event.keyIdentifier == "PageUp") {
                scrollArea.scrollPageUp();
            }
            else if (event.keyIdentifier == "PageDown") {
                scrollArea.scrollPageDown();
            }
            else if (event.metaKey && event.keyIdentifier == "Home") {
                scrollArea.scrollHome();
            }
            else if (event.metaKey && event.keyIdentifier == "End") {
                scrollArea.scrollEnd();
            }

            // First key handling
            else if (firstKey && edit.value === "" &&
                (ch == '+' || ch == '-' || ch == "*" || ch == "/" || ch == "%" || ch == "&" || ch == "|" || ch == "^")) {
                edit.value = "answer" + ch;
                edit.selectionStart = edit.value.length;
                firstKey = false;
            }

            // Enter expression
            else if (event.keyIdentifier == "Enter") {

                var addToHistory = true;

                if (edit.value === "") {
                    // Use last expression
                    var prevExpression = CalcWidget.Calc.getHistoryPrev();
                    if (prevExpression !== null) {
                        edit.value = prevExpression;
                        addToHistory = false;
                    }
                }

                if (edit.value !== "") {
                    // Calculate
                    var expression = edit.value;
                    var result = CalcWidget.Calc.calc(expression, addToHistory);
                    edit.value = "";
                    firstKey = true;

                    // Output results.
                    var resultClass = CalcWidget.Calc.wasError()?"error":"answer";
                    outputHTML("<div class='input'>" + expression + "</div>" +
                        "<div class='" + resultClass + "'>" + result + "</div>");
                }
            }

            // Toggle completions
            else if (event.keyIdentifier == tab) {
                edit.focus();

                if (completions !== null && completions.length > 1) {
                    var lastCompletion = edit.value.substr(completionWordStart);
                    var offset = (event.shiftKey?completions.length-1:1);
                    for (var i = 0; i < completions.length; i++) {
                        if (lastCompletion == completions[i]) {
                            var s = edit.selectionStart;
                            var j = (i+offset) % completions.length;
                            edit.value = edit.value.substr(0, completionWordStart) +
                                completions[j];
                            if (autocompletion) {
                                edit.selectionStart = s;
                                edit.selectionEnd = edit.value.length;
                            }
                            break;
                        }
                    }
                }

                if (!autocompletion && completions === null) {
                    CalcWidget.UI.autoComplete();
                }
            }

            // Hotkey: clear
            else if (ch == 'k' && event.metaKey) {
                CalcWidget.UI.clearOutput();
            }

            // Hotkey: show mem
            else if (ch == 'm' && event.metaKey) {
                CalcWidget.UI.showMemory();
            }

            // Complete with '('
            // Disabled because it wouldn't allow user to type "a()"
            //else if (hadCompletions && ch == '(') {
            //    edit.value = edit.value + "()";
            //    edit.selectionStart = edit.value.length - 1;
            //    edit.selectionEnd = edit.value.length - 1;
            //}

            // Convert european numpad ',' to '.' (3 == numpad)
            else if (ch == ',' && event.keyLocation == 3) {
                CalcWidget.UI.replaceSelection('.');
            }

            // Normal key handling
            else {
                // Prepare for auto-completion
                if (autocompletion && edit.selectionEnd == edit.value.length &&
                    (ch == '_' || CalcWidget.isAlphaNumeric(ch)))
                {
                    autoCompleteTimerID = setTimeout(CalcWidget.UI.autoComplete, 250);
                }
                // Return (don't stop propagation)
                return;
            }

            event.stopPropagation();
            event.preventDefault();
        },

        autoComplete: function() {
            var edit = document.getElementById('edit');
            var length = edit.value.length;
            if (length > 0 && edit.selectionStart == length) {
                // Find the last word, if any
                var word = "";
                var wordStart = 0;
                for (var i = length - 1; i >= 0; i--) {
                    var ch = edit.value.charAt(i);
                    if (ch == '_' || CalcWidget.isAlphaNumeric(ch)) {
                        word = ch + word;
                    }
                    else {
                        wordStart = i + 1;
                        break;
                    }
                }
                if (word.length > 0) {
                    var completions = CalcWidget.UI.getCompletions(edit.value, wordStart);
                    if (completions.length > 0) {
                        var completion = completions[0];
                        if (!autocompletion) {
                            // Make the first completion of "e" be "exp", then cycle back to "e"
                            if (edit.value.substr(wordStart) == completion &&
                                completions.length > 1)
                            {
                                completion = completions[1];
                            }
                        }
                        edit.value = edit.value.substr(0, wordStart) + completion;
                        if (autocompletion) {
                            edit.selectionStart = length;
                            edit.selectionEnd = edit.value.length;
                        }
                    }
                }
            }
        },

        replaceSelection: function(text) {
            var edit = document.getElementById('edit');
            var len = edit.selectionStart + text.length;
            edit.value = edit.value.substr(0, edit.selectionStart) + text +
                edit.value.substr(edit.selectionEnd);
            edit.selectionStart = len;
            edit.selectionEnd = len;
        },

        getCompletions: function(text, wordStart) {
            // Get all possible completions
            var possibleCompletions = CalcWidget.Calc.getUserVars();
            for (var i in CalcWidget.Math) {
                if (i.charAt(0) != '_') {
                    possibleCompletions.push(i);
                }
            }
            possibleCompletions.push("answer");

            // Find completions for this word
            var word = text.substr(wordStart);
            completions = [];
            completionWordStart = wordStart;
            for (var j in possibleCompletions) {
                if (possibleCompletions.hasOwnProperty(j)) {
                    var name = possibleCompletions[j];
                    if (name.indexOf(word) === 0) {
                        completions.push(name);
                    }
                }
            }
            completions.sort();
            return completions;
        }
    };
})();

// Util methods

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
                s += i + ":" + value + ", ";
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

// Extend Apple's scoll area

AppleScrollArea.prototype.scrollUp = function() {
    this.verticalScrollTo(this.content.scrollTop - this.singlepressScrollPixels);
};

AppleScrollArea.prototype.scrollDown = function() {
    this.verticalScrollTo(this.content.scrollTop + this.singlepressScrollPixels);
};

AppleScrollArea.prototype.scrollPageUp = function() {
    this.verticalScrollTo(this.content.scrollTop - this.viewHeight);
};

AppleScrollArea.prototype.scrollPageDown = function() {
    this.verticalScrollTo(this.content.scrollTop + this.viewHeight);
};

AppleScrollArea.prototype.scrollHome = function() {
    this.verticalScrollTo(0);
};

AppleScrollArea.prototype.scrollEnd = function() {
    this.verticalScrollTo(this.content.scrollHeight - this.viewHeight);
};

AppleScrollArea.prototype.keyPressed = function(event) {
    // Do nothing
};
