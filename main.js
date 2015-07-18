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
        esprima = require("./esprima"),
        $toolBarButn = $('<a href="#" id="toolbar-navigator" title="navigator"></a>'),
        $navigatorPanel = $(navigatorTemplate),
        $content = $(".content"),
        $mainView = $(".main-view"),
        $navigatorMsg = $navigatorPanel.find("#navigator-msg"),
        $navigatorTree = $navigatorPanel.find("#navigator-tree"),
        isPanelOpen = false,
        document,
        language;
    

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
                if (node[1][0][1][0] === "function") {
                    tree += "<li class='tree-function'>function " + node[1][0][0] + "</li>";
                    tree += "<ul>";
                    tree = astNodeAnalysis(node[1][0][1][3][0], tree);
                    tree += "</ul>";
                } else {
                    tree += "<li>var " + node[1][0][0] + "("+ node[1][0][1][0] +")</li>";
                }
            break;
            
            case "call":
                tree += "<li>call</li>";
                if(node[2].length === 0) {
                    tree = astNodeAnalysis(node[1], tree);
                } else {
                    tree = astNodeAnalysis(node[2][0], tree);
                }
            break;

            case "defun":
                tree += "<li class='tree-function'>function " + node[1] + "</li>";
                tree += "<ul>";
                $.each(node[3], function (i, node){
                    tree = astNodeAnalysis(node, tree);
                });
                tree += "</ul>";
            break;
            
            case "function":
                tree += "<ul>";
                $.each(node[3], function (i, node){
                    tree = astNodeAnalysis(node, tree);
                });
                tree += "</ul>";
            break;
            
            case "stat":
                tree = astNodeAnalysis(node[1], tree);
            break;

            default:
                console.log("inconnu : " + node[0]);
        }
        
        return tree;
    };
    
    var esprimaAnalysis = function (node, tree) {
    
        if (node.type !== undefined) {
            tree += "<li>";

            switch(node.type) {
                case "Program":
                    tree += "program";
                    $.each(node.body, function (i, subNode) {
                        tree = esprimaAnalysis(subNode, tree);
                    });
                break;

                case "ExpressionStatement":
                    tree += "ExpressionStatement";
                    tree = esprimaAnalysis(node.expression, tree);
                break;
                    
                case "CallExpression":
                    tree += "CallExpression";
                    $.each(node.arguments, function (i, subNode) {
                        tree = esprimaAnalysis(subNode, tree);
                    });
                    
                    tree = esprimaAnalysis(node.callee, tree);
                break;
                
                case "Identifier":
                    tree += "Identifier " + node.name + " (stop)";
                break;
                
                case "FunctionExpression":
                    tree += "FunctionExpression";
                    $.each(node.params, function (i, subNode) {
                        tree = esprimaAnalysis(subNode, tree);
                    });
                    
                    tree = esprimaAnalysis(node.body, tree);
                break;
                
                case "BlockStatement":
                    tree += "BlockStatement";
                    $.each(node.body, function (i, subNode) {
                        tree = esprimaAnalysis(subNode, tree);
                    });
                break;
                
                case 'VariableDeclaration':
                    tree += "VariableDeclaration";
                    $.each(node.declarations, function (i, subNode) {
                        tree = esprimaAnalysis(subNode, tree);
                    });
                break;
                
                case "VariableDeclarator":
                    tree += "VariableDeclarator";
                    tree = esprimaAnalysis(node.id, tree);
                break;
                
                default:
                    tree += "unsupported type " + node.type;
            }

            tree += "</li>";
        } else {
            tree += "<li>type undefined</li>";
        }
        
        return tree;
    };
    
    
    /**
    * perform analysis of the file
    */
    var performAnalysis = function () {
        document = DocumentManager.getCurrentDocument();
        if (document) {
            language = document.language.getName();
            if (language === "JavaScript") {
                navigatorMsgDisplay(false);
                
                var node = esprima.parse(document.getText(), {comment: true}),
                    treeRender = "<ul>";
                   
                treeRender += esprimaAnalysis(node, treeRender);
                
                treeRender += "</ul>";
                
                $navigatorTree.html(treeRender);
            } else {
                navigatorMsgDisplay(true, language.toLowerCase() + " non supporté");
            }
        } else {
            navigatorMsgDisplay(true, "Aucun document à analyser");
        }
    };
         
            
    var activeEditorChangeHandler = function (event, focusedEditor, lostEditor) {
        performAnalysis();
    };
                     
    var documentOnSave = function () {
        if (isPanelOpen) {
            performAnalysis();
        }                                
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
                DocumentManager.on("documentSaved", documentOnSave);
            } else {
                EditorManager.off("activeEditorChange", activeEditorChangeHandler);
                DocumentManager.off("documentSaved", documentOnSave);
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