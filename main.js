/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets */

/** ajoute un panel à droite qui va inspecter le code */
define(function (require, exports, module) {
    "use strict";
    
    /*
    https://github.com/adobe/brackets/wiki/How-to-write-extensions#addpanel
    Unofficial techniques - adding UI elements directly through the DOM works, 
    but puts you on shaky ground. Code that does this will break as Brackets 
    updates evolve the UI. Use these code snippets as best practices that behave 
    as nicely as possible given the risks:

    Add a toolbar icon: (unofficial) Use $myIcon.appendTo($("#main-toolbar .buttons")).

    Add a top panel/toolbar: (unofficial) Use $myPanel.insertBefore("#editor-holder").
    */
    
    
    var ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        WorkspaceManager = brackets.getModule("view/WorkspaceManager"),
        $toolBarButn = $('<a href="#" id="toolbar-navigator" title="navigator"></a>'),
        $navigatorPanel = $('<div id="navigator-panel"><div id="navigator-content"><h5>NAVIGATOR</h5></div></div>'),
        $content = $(".content"),
        $mainView = $(".main-view");
        
    
    var initialize = function () {
        // ajoute le bouton dans la toolbar
        $toolBarButn.appendTo($("#main-toolbar .buttons"));
        
        // ajoute le panel
        $content.after($navigatorPanel);
        $toolBarButn.on("click", function (e) {
            $mainView.toggleClass('navigator-panel-open');
        });
    };
    
//    ajoute un panel dans la stack verticale du content
//    var $panel = $("<div id='navigator-panel'>panel</div>"),
//        id = "navigator-panel",
//        minSize = 100;
//    
//    var myPanel = WorkspaceManager.createBottomPanel(id, $panel, minSize);
//    myPanel.show();
    
//    TODO ajouter panel après #content et mettre #content right de 100px pour le faire apparaitre
//    note le navigator doit être dessous le content, le content glisse pour le faire apparaitre
//    idem espresso, le navigator n'est pas redimensionnable (du moins pour l'instant)
//    le bouton permet d'afficher/masquer le navigator avec un glissement en CSS3

    
    
    ExtensionUtils.loadStyleSheet(module, "navigator.css").then(
        function () {
            console.log("navigator css loaded");
            initialize();
        }
    );
});