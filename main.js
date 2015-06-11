/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets */

/** add a panel on the right and show in code structure of the current file opened*/
define(function (require, exports, module) {
    "use strict";
    
    
    var ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        WorkspaceManager = brackets.getModule("view/WorkspaceManager"),
        $toolBarButn = $('<a href="#" id="toolbar-navigator" title="navigator"></a>'),
        $navigatorPanel = $('<div id="navigator-panel"><div id="navigator-content"><h5>NAVIGATOR</h5></div></div>'),
        $content = $(".content"),
        $mainView = $(".main-view");
        
    /**
    * init extension (only if stylesheet is loaded ... see at the bottom)
    */
    var initialize = function () {
        // add button in the toolbar
        $toolBarButn.appendTo($("#main-toolbar .buttons"));
        
        // add panel on the right
        $content.after($navigatorPanel);
        
        // listen to click event on the button to show/hide navigator
        $toolBarButn.on("click", function (e) {
            $mainView.toggleClass('navigator-panel-open');
        });
    };
    
    /**
    * load stylesheet and then init extension
    */
    ExtensionUtils.loadStyleSheet(module, "navigator.css").then(
        function () {
            initialize();
        }
    );
});