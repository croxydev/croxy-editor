var JavaScriptMode = ace.require('ace/mode/javascript').Mode;
var editorInstance = ace.edit('editor');

editorInstance.setTheme('ace/theme/twilight');
editorInstance.session.setMode(new JavaScriptMode());