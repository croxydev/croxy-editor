const loader = require('monaco-loader');
const { remote } = require('electron');
const FileManager = require('./filemanager');
var $ = require('./js/jquery.min.js')
const fs = require('fs');
const path = require("path");

const DiscordRPCSettings = () => {
	const modalPath = path.join('file://',__dirname,'DiscordRPC.html');
	let win = new remote.BrowserWindow({ 
		width:600, height:375, minHeight:375, center: true, minWidth:600, maxWidth:600, maxHeight:375, frame:false,
		webPreferences: {
			nodeIntegration: true,
			enableRemoteModule: true
		}
		});
	win.on("close",function(){
		win=null;
	});
	win.loadURL(modalPath);
	win.show();
}

document.querySelector('#discordSettings').onclick = () => DiscordRPCSettings();

loader().then((monaco) => {
	const editor = monaco.editor.create(document.getElementById('container'), {
		language: 'txt',
		roundedSelection: false,
		scrollBeyondLastLine: false,
		readyOnly: false,
		theme: 'vs-dark',
		automaticLayout: true,
	});
	const fileManager = new FileManager({ editor, monaco });
	remote.getCurrentWindow().show();
	var folder = fs.readFileSync("./data/lastFolder.json")
	if(folder) {
		var f = JSON.parse(folder);
		if(f.folder) {
			fileManager.openDir(f.folder)
		}
	}
	$(window).bind('keydown', function(event){
		if (event.ctrlKey) {
			switch (String.fromCharCode(event.which).toLowerCase()) {
				case 's':
					event.preventDefault();
					fileManager.saveFile();
					break;
				case 'o':
					event.preventDefault();
					fileManager.open();
					break;
			}

		}

		if (event.ctrlKey && event.altKey || event.metaKey) {
			switch (String.fromCharCode(event.which).toLowerCase()) {
				case 'o':
					event.preventDefault();
					fileManager.selectFolder();
					break;
			}
		}

	});
})