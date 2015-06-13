/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets */

/** add a panel on the right and show in code structure of the current file opened*/
define(function (require, exports, module) {
    "use strict";
    
    
    var ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        WorkspaceManager = brackets.getModule("view/WorkspaceManager"),
        DocumentManager = brackets.getModule("document/DocumentManager"),
        EditorManager = brackets.getModule("editor/EditorManager"),
        navigatorTemplate = require("text!navigator-template.html"),
        parseJS = require("./parse-js"),
        $toolBarButn = $('<a href="#" id="toolbar-navigator" title="navigator"></a>'),
        $navigatorPanel = $(navigatorTemplate),
        $content = $(".content"),
        $mainView = $(".main-view"),
        $navigatorMsg = $navigatorPanel.find("#navigator-msg"),
        $navigatorTree = $navigatorPanel.find("#navigator-tree"),
        isPanelOpen = false,
        document;
    

    /**
    * show/hide msg and write text if defined
    */
    var navigatorMsgDisplay = function (bool, text) {
        if (bool) {
            if (text === undefined) {
                text = "";
            }
            $navigatorTree.hide();
            $navigatorMsg.html(text).show();
        } else {
            $navigatorMsg.empty().hide();
            $navigatorTree.empty().show();
        }
    };
    
    /**
    * analyse d'un noeud AST
    */
    var astNodeAnalysis = function (node, tree) {
        console.log(node[0]);
        switch (node[0]) {
            case "toplevel":
                tree += "<li>toplevel</li>";
                tree = astNodeAnalysis(node[1][0], tree);
            break;
            
            case "var":
                tree += "<li>var " + node[1][0][0] + "</li>";
            break;
            
            case "call":
                tree += "<li>call</li>";
                tree = astNodeAnalysis(node[1], tree);
            break;

            case "defun":
                
            break;
            
            case "function":
                $.each(node[3], function (i, node){
                    tree = astNodeAnalysis(node, tree);
                });
            break;
            
            case "stat":
                tree = astNodeAnalysis(node[1], tree);
            break;

            default:
                console.log("inconnu : " + node[0]);
        }
        
        return tree;
    };
    
    
    /**
    * perform analysis of the file
    */
    var performAnalysis = function () {
        document = DocumentManager.getCurrentDocument();
        if (document) {
            if (document.language.getName() === "JavaScript") {
                navigatorMsgDisplay(false);
                
                var ast = parse(document.getText()),
                    tree = "<ul>";
                    
                console.log(ast);
                
                tree = astNodeAnalysis(ast, tree);
                
//                for (var i = 0, l = ast[1].length; i<l; i++) {
//                    el = ast[1][i];
//                    console.log(el);
//                    switch (el[0]) {
//                        case "var":
//                            tree += "<li>" + el[1][0][1][0] + " " + el[1][0][0] + "</li>";
//                        break;
//
//                        case "defun":
//                            tree += "<li>function " + el[1] + "</li>";
//                        break;
//
//                        default:
//                            console.log("inconnu : " + el[0]);
//                    }
//                };
                
                tree += "</ul>";
                
                $navigatorTree.html(tree);
            } else {
                navigatorMsgDisplay(true, "Language non supporté");
            }
        } else {
            navigatorMsgDisplay(true, "Aucun document à analyser");
        }
    };
         
            
    var activeEditorChangeHandler = function (event, focusedEditor, lostEditor) {
        performAnalysis();
    };
                     
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
            isPanelOpen = !isPanelOpen;
            
            if (isPanelOpen) {
                performAnalysis();
                EditorManager.on("activeEditorChange", activeEditorChangeHandler);
            } else {
                EditorManager.off("activeEditorChange", activeEditorChangeHandler);
            }
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