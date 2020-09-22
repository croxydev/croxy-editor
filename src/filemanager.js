const { ipcRenderer, remote } = require('electron');
const fs = require('fs');
const path = require('path');
var $ = require('./js/jquery.min.js')

var fileTypes = {
	css: "css",
	js: "javascript",
	json: "json",
	md: "markdown",
	mjs: "javascript",
	ts: "typescript",
	html: "html",
	py: "python",
	css: "css",
	go: "go",
	cs: "cs",
	cpp: "cpp",
	c: "c"
}

var icons = {
	css: "css",
	js: "javascript",
	json: "json",
	mjs: "javascript",
	ts: "typescript",
	html: "html",
	py: "python",
	css: "css",
	cs: "cs",
	cpp: "cpp",
	c: "c"
}

var faIcons = {
	js: "fab fa-js",
	md: "fab fa-markdown",
	html: "fa fa-html5",
	py: "fab fa-python",
	json: "fas fa-database",
	ts: "devicon-typescript-plain",
	php: "devicon-php-plain",
	go: "devicon-go-plain",
	css: "devicon-css3-plain",
	cs: "devicon-csharp-plain",
	cpp: "devicon-cplusplus-plain",
	c: "devicon-c-plain"
}

const DiscordRPC = require("discord-rpc");
const rpc = new DiscordRPC.Client({transport:"ipc"})
const clientId = '757017696570310716';

const defaultPresence = {
	largeImageKey: "app",
	largeImageText: "Croxy Editor",
	startTimestamp: Date.now(),
	instance: true,
}

rpc.login({clientId}).catch((e) => console.log(e))
rpc.on("connected", () => {
	document.getElementById("discord").innerHTML = "Discord RPC is connected."
	rpc.setActivity({...defaultPresence})
})

class FileManager {
	constructor({ editor, monaco }) {
		const self = this;
		this.editor = editor;
		this.monaco = monaco;
		this.file = null;
		this.folder = null;
		this.files = [];

		if(!fs.existsSync("data")) {
			fs.mkdirSync("data");
			if(!fs.existsSync("./data/lastFile.json") && !fs.existsSync("./data/lastFolder.json") && !fs.existsSync("./data/rpcSettings.json")) {
				fs.writeFileSync("./data/lastFolder.json", JSON.stringify({}))
				fs.writeFileSync("./data/lastFile.json", JSON.stringify({}))
				fs.writeFileSync("./data/rpcSettings.json", JSON.stringify({details:"Editing: {file}", state:"Workspace: {workspace}"}))
			}
		}

		this.rpcSettings = JSON.parse(fs.readFileSync("./data/rpcSettings.json"))

		// When we receive a 'open-file' message, open the file
		ipcRenderer.on('open-file', (e, url) => this.openFile(url));

		document.querySelector('#save').onclick = () => this.saveFile();
		document.querySelector('#open').onclick = () => this.open();
		document.querySelector('#openFolder').onclick = () => this.openFolder();
		document.querySelector('#files-folders').onclick = (function(event) {
			var id = event.target.id;
			if(id.startsWith("ftab_")) {
				var tab = id.slice(5);
				if(tab === self.file) return;
				self.changeTab(tab)
				self.file = tab;
				$(`#tabs li.active`).removeClass("active")
				if(document.getElementById(`tab_${tab}`)) {
					document.getElementById(`tab_${tab}`).classList.add("active")
				} else {
					$("#tabs").append('<li class="active" id="tab_'+tab+'"><a href="#" id="tab_'+tab+'">'+tab.split("\\").pop()+' <i class="fa fa-close close-button" style="color:white;" id="close_'+tab+'"></i> </a></li>');
				}
			} else {
				if(document.getElementById(`${id}`)) {
					if(document.getElementById(`${id}`).classList[0] === "expanded") {
						document.getElementById(`${id}`).classList.remove("expanded")
					} else {
						document.getElementById(`${id}`).classList.add("expanded")
						self.openSubDir(id.slice(7))
					}
				}
			}
		});
		document.querySelector('#tabs').onclick = (function(event) {
			var id = event.target.id;
			if(id.startsWith("close_")) {
				var tab = id.slice(6);
				document.getElementById(`tab_${tab}`).remove();
				if(tab.split("\\").pop() === self.file.split("\\").pop()) {
					rpc.setActivity({...defaultPresence})
					self.editor.setModel(self.monaco.editor.createModel('', "txt"))
					self.file = null;
				}
				return;
			}
			if(id.startsWith("tab_")) {
				var tab = id.slice(4);
				if(tab === self.file) return;
				try {
					if(tab.split("\\").pop() === self.file.split("\\").pop()) {
						self.openFile(tab)
					} else {
						self.changeTab(tab)
					}
				} catch (err) {
					self.openFile(tab)
				}
				self.file = tab;
				$(`#tabs li.active`).removeClass("active")
				if(document.getElementById(`tab_${tab}`)) {
					document.getElementById(`tab_${tab}`).classList.add("active")
				} else {
					$("#tabs").append('<li class="active" id="tab_'+tab+'"><a href="#" id="tab_'+tab+'">'+tab.split("\\").pop()+' <i class="fa fa-close close-button" style="color:white;" id="close_'+tab+'"></i> </a></li>');
				}
			}
		});
	}

	openFile(url) {
		console.log(url)
		// fs.readFile doesn't know what `file://` means
		const parsedUrl = (url.slice(0, 7) === 'file://') ? url.slice(7) : (!url.startsWith("C:") ? path.join(this.folder, url) : url);

		fs.readFile(parsedUrl, 'utf-8', (err, data) => {
			if(this.file) {
				$(`#tabs li.active`).removeClass("active")
			}
			this.file = parsedUrl;
			this.editor.setModel(this.monaco.editor.createModel(data, fileTypes[url.split('.').pop()]));
			if(document.getElementById(`tab_${parsedUrl}`)) {
				document.getElementById(`tab_${parsedUrl}`).classList.add("active")
			} else {
				$("#tabs").append('<li class="active" id="tab_'+parsedUrl+'"><a href="#" id="tab_'+parsedUrl+'">'+url.split("\\").pop()+' <i class="fa fa-close close-button" style="color:white;" id="close_'+tab+'"></i> </a></li>');
			}
			this.rpcSettings = JSON.parse(fs.readFileSync("./data/rpcSettings.json"))
			const defaultPresence = {
				largeImageKey: icons[url.split('.').pop()] || "file",
				smallImageKey: "app",
				largeImageText: `Editing a ${icons[url.split('.').pop()] ? icons[url.split('.').pop()].toUpperCase() +" file" : "file"}`,
				smallImageText: "Croxy Editor",
				startTimestamp: Date.now(),
				instance: true,
				details: this.rpcSettings["details"].replace("{file}", url.split("\\").pop()).replace("{workspace}", (this.folder ? this.folder.split("\\").pop() : "Unknown")),
				state: this.rpcSettings["state"].replace("{file}", url.split("\\").pop()).replace("{workspace}", (this.folder ? this.folder.split("\\").pop() : "Unknown")),
			}
			rpc.setActivity({...defaultPresence})

		});
	}

	changeTab(url) {
		// fs.readFile doesn't know what `file://` means
		const parsedUrl = (url.slice(0, 7) === 'file://') ? url.slice(7) : (!url.startsWith("C:") ? path.join(this.folder, url) : url);
		$(`#tabs li.active`).removeClass("active")
		fs.readFile(parsedUrl, 'utf-8', (err, data) => {
			this.file = parsedUrl;
			this.rpcSettings = JSON.parse(fs.readFileSync("./data/rpcSettings.json"))
			this.editor.setModel(this.monaco.editor.createModel(data, fileTypes[url.split('.').pop()]));
			const defaultPresence = {
				largeImageKey: icons[url.split('.').pop()] || "file",
				smallImageKey: "app",
				largeImageText: `Editing a ${icons[url.split('.').pop()] ? icons[url.split('.').pop()].toUpperCase() +" file" : "file"}`,
				smallImageText: "Croxy Editor",
				startTimestamp: Date.now(),
				instance: true,
				details: this.rpcSettings["details"].replace("{file}", url.split("\\").pop()).replace("{workspace}", (this.folder ? this.folder.split("\\").pop() : "Unknown")),
				state: this.rpcSettings["state"].replace("{file}", url.split("\\").pop()).replace("{workspace}", (this.folder ? this.folder.split("\\").pop() : "Unknown")),
			}
			rpc.setActivity({...defaultPresence})
		});
	}

	openSubDir(url) {
		var files = []
		if(url.startsWith("C:")) {
			var parsedUrl = url;
		} else {
			var parsedUrl = path.join(this.folder, url);
		}
		const dir = fs.readdirSync(parsedUrl)
		for(let name of dir) {
			files.push(this.createDirectoryItem(name, path.join(parsedUrl, name)));
		}
		var folder = url
		$(`#folder_${folder}`).append(`<li id="folder_${folder}"></li>`);
		var el = document.getElementById(`folder_${folder}`);
		var list = []
		var DocumentFragment = document.createDocumentFragment();
		files.filter((file) => file.extension === "folder").forEach((file) => {
			if(!document.getElementById(`folder_${file.fullpath}`)) {
				var li = document.createElement("li");
				var ul = document.createElement("ul");
				li.id = `folder_${file.fullpath}`;
				li.innerHTML = `<div class="arrow"><i class="fa fa-angle-down"></i></div><i class="${file.name === "node_modules" ? "fa fa-folder node" : "fa fa-folder"}"></i> ${file.name}`;
				ul.appendChild(li)
				list.push(ul)
			}
		})

		files.filter((file) => file.extension !== "folder").forEach((file) => {
			if(!document.getElementById(`ftab_${(!file.fullpath.startsWith("C:") ? path.join(this.folder, file.fullpath) : file.fullpath)}`)) {
				var li = document.createElement("li");
				var ul = document.createElement("ul");
				li.id = `ftab_${(!file.fullpath.startsWith("C:") ? path.join(this.folder, file.fullpath) : file.fullpath)}`;
				li.innerHTML = `<i class="${faIcons[file.extension] || "fa fa-file"}"></i> ${file.name}`;
				ul.appendChild(li)
				list.push(ul)
			}
		});
		for(var i = 0; i < list.length; i++) {
			DocumentFragment.appendChild(list[i])
		}
		el.appendChild(DocumentFragment)
	}

	openDir(url) {
		this.files = [];
		const parsedUrl = url;

		fs.readdir(parsedUrl, 'utf-8', (err, dir) => {
			$("#files-folders").empty();
			this.folder = parsedUrl;
			for(let name of dir) {
				let fullpath = path.join(parsedUrl, name);
				this.files.push(this.createDirectoryItem(name, fullpath));
			}
			this.files.filter((file) => file && file.extension === "folder").forEach((file) => {
				$("#files-folders").append(`<li id="folder_${file.fullpath.split("\\").pop()}"></li>`);

				const el = $(`#files-folders #folder_${file.fullpath.split("\\").pop()}`);
				if(file.name === "node_modules") {
					el.append(`<i class="fa fa-folder node"></i> `);
				} else {
					el.append(`<i class="fa fa-folder"></i> `);
				}
				el.append(file.name);
				el.append(`<div class="arrow"><i class="fa fa-angle-down"></i></div>`);
			})

			this.files.filter((file) => file && file.extension !== "folder").forEach((file) => {
				$("#files-folders").append(`<li id="ftab_${(!file.fullpath.startsWith("C:") ? path.join(this.folder, file.fullpath) : file.fullpath)}"><i class="${faIcons[file.extension] || "fa fa-file"}"></i> ${file.name}</li>`)
			});

		})
	}

	saveFile() {
		if(!this.file) {
			remote.dialog.showSaveDialog((filename) => {
				if (!filename) return;

				const model = this.editor.getModel();
				fs.writeFileSync(filename, model.getLinesContent().join("\n"));
				this.file = filename.replace("file://", "");
				this.editor.setModel(this.monaco.editor.createModel(model.getLinesContent().join("\n"), fileTypes[this.file.split('.').pop()]));
			});
			return;
		}
		fs.readFile(this.file, 'utf-8', (err, data) => {
			if(data === undefined || err) {
				remote.dialog.showSaveDialog((filename) => {
					if (!filename) return;

					const model = this.editor.getModel();
					fs.writeFileSync(filename, model.getLinesContent().join("\n"));
					this.editor.setModel(this.monaco.editor.createModel(model.getLinesContent().join("\n"), fileTypes[this.file.split('.').pop()]))
				});
			} else {
				const model = this.editor.getModel();
				fs.writeFileSync(this.file, model.getLinesContent().join("\n"));
			}
		})
	}

	async open() {
		var file = await remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
			properties: ["openFile"]
		})
		file = file.filePaths.length === 0 ? undefined : file.filePaths[0]
		if(!file) return;
		fs.writeFileSync("./data/lastFile.json",JSON.stringify({file:file}));
		this.openFile(file)
	}

	async openFolder() {
		var folder = await remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
			properties: ["openDirectory"]
		})
		folder = folder.filePaths.length === 0 ? undefined : folder.filePaths[0]
		if(!folder) return;
		fs.writeFileSync("data/lastFolder.json", JSON.stringify({folder:folder}));
		this.folder = folder;
		this.openDir(folder)
	}

	/*createDirectoryItem(name, fullpath) {
		if(fullpath.includes("node_modules")) return;
		let result = new Object({
			name,
			fullpath,
			extension: path.extname(name).length > 1 ? path.extname(name).slice(1) : (fs.statSync(fullpath).isDirectory() ? "folder" : "file"),
			children: []
		});

		let files = fs.statSync(fullpath).isDirectory() ? fs.readdirSync(fullpath) : [];
		for(var file of files) {
			result.children.push(this.createDirectoryItem(file, path.join(fullpath, file)))
		}

		return result;
	};*/

	createDirectoryItem(name, fullpath) {
		let result = new Object({
			name,
			fullpath,
			extension: path.extname(name).length > 1 ? path.extname(name).slice(1) : (fs.statSync(fullpath).isDirectory() ? "folder" : "file"),
		});

		return result;
	};
}

module.exports = FileManager;

