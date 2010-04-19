
CalcWidget.UI.onLoad = function() {
    CalcWidget.UI.onLoadInternal();
}

CalcWidget.UI.onUnload = function() {
    CalcWidget.Calc.saveUserVars();
}

CalcWidget.UI.scrollTo = function(element) {
    CalcWidget.UI.scrollEnd();
};

CalcWidget.UI.scrollUp = function() {
    var scrollArea = document.getElementById("scrollArea");
    scrollArea.scrollTop = scrollArea.scrollTop - 20;
};

CalcWidget.UI.scrollDown = function() {
    var scrollArea = document.getElementById("scrollArea");
    scrollArea.scrollTop = scrollArea.scrollTop + 20;
};

CalcWidget.UI.scrollPageUp = function() {
    var scrollArea = document.getElementById("scrollArea");
    scrollArea.scrollTop = scrollArea.scrollTop - scrollArea.offsetHeight;
};

CalcWidget.UI.scrollPageDown = function() {
    var scrollArea = document.getElementById("scrollArea");
    scrollArea.scrollTop = scrollArea.scrollTop + scrollArea.offsetHeight;
};

CalcWidget.UI.scrollHome = function() {
    var scrollArea = document.getElementById("scrollArea");
    scrollArea.scrollTop = 0;
};

CalcWidget.UI.scrollEnd = function() {
    var scrollArea = document.getElementById("scrollArea");
    scrollArea.scrollTop = scrollArea.scrollHeight - scrollArea.offsetHeight;
};