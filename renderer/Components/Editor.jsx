import React, { useEffect, useRef, useState } from "react";
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { json } from '@codemirror/lang-json'
import { php } from '@codemirror/lang-php'
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { ipcRenderer } from "electron";
import path from "path";
import DiscordRPC from 'discord-rpc';
import fs from "node:fs";
import os from "node:os";

var home = os.homedir()
var _appPath = path.join(home, 'Documents', 'Croxy Code Editor')

const extensions = {
	json: json({ }),
	php: php({ }),
	ts: javascript({ jsx: true, typescript: true }),
	js: javascript({ jsx: true, typescript: true }),
	jsx: javascript({ jsx: true, typescript: true }),
	tsx: javascript({ jsx: true, typescript: true }),
	html: html({ })
};

export default class _app extends React.Component {
	constructor(props) {
		super(props)
		// I put this since I use class based component. 
		// a functional ones won't need this
		this.handleIpc = this.handleIpc.bind(this)
		this.state = {
			openFiles: [],
			previousFile: undefined,
			activeTab: '',
			value: ''
		};
		this.editor = React.createRef()
	}
	componentDidMount() {
		this.handleIpc() // to make sure the ipcRenderer manipulate the component state AFTER the whole component was loaded first
	}
  
	handleIpc() {
	  var self = this

	  var settings = JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json')))

		if(settings.lastFiles.length >= 1) {
			settings.lastFiles.map((file) => {
				ipcRenderer.send("drop", {
					path: file,
					name: path.basename(file),
					autoOpen: true
				})
			})
			ipcRenderer.send("drop", {
				path: settings.lastActiveFile,
				name: path.basename(settings.lastActiveFile),
				autoOpen: true
			})
		}

	  ipcRenderer.on("saveFile", function(e, arg) {
		if(self.state.openFiles.find((p) => p.path === self.state.activeTab)) {
			var file = self.state.openFiles.find((p) => p.path === self.state.activeTab);
			fs.writeFileSync(path.normalize(file.path), `${file.value}`)
			ipcRenderer.send("fileSaved", file)
		} else {
			if(typeof arg === "string") {
				fs.writeFileSync(path.normalize(arg), self.state.value)
				var files = self.state.openFiles
				if(!files.find((p) => p.path === arg)) {
					files.push({name: path.basename(arg), value: self.state.value, path: arg, mainFolder: "Unknown", isEdited: false})
					self.setState({openFiles: files})
					console.log({
						eventName: "changeTab",
						fileName: path.basename(arg),
						path: arg,
						mainFolder: "Unknown",
						fileExtension: path.extname(path.basename(arg)).length > 1 ? path.extname(path.basename(arg)).slice(1) : undefined,
						isEdited: false,
						value: files.find((file) => file.path === arg).value
					})
					ipcRenderer.send("changeFile", {
						eventName: "changeTab",
						fileName: path.basename(arg),
						path: arg,
						mainFolder: "Unknown",
						fileExtension: path.extname(path.basename(arg)).length > 1 ? path.extname(path.basename(arg)).slice(1) : undefined,
						isEdited: false
					})
				}
			} else if(arg !== undefined) {
				ipcRenderer.send("saveNewFile")
			}
		}
		//console.log(self.editor.current.state.doc)
	  })

	  ipcRenderer.on("openFile", function (e, data) {
		var files = self.state.openFiles
		if(!files.find((p) => p.path === data.path)) {
			files.push({name: data.name, value: data.value, path: data.path, mainFolder: data.mainFolder, isEdited: false})
			self.setState({openFiles: files})
		}
		self.setState({activeTab: data.path})
		ipcRenderer.send("fileSelected", { 
			fileName: data.name,
			setRPC: true,
			mainFolder: data.mainFolder,
			fileExtension: path.extname(data.name).length > 1 ? path.extname(data.name).slice(1) : undefined,
			path: data.path
		  })
	  })
	  ipcRenderer.on("closeFile", function (e, data) {
		var files = self.state.openFiles
		var previousFile = files[files.findIndex(x => x.path === data.path) - 1]
		files = files.filter((file) => file.path !== data.path)
		self.setState({openFiles: files})
			if(previousFile === undefined) {
				ipcRenderer.send("fileSelected", { 
					setRPC: true,
					fileClosed: true,
				})
				self.setState({activeTab: ''})
			} else {
				if(previousFile) {
					ipcRenderer.send("fileSelected", { 
						fileName: previousFile.name,
						setRPC: true,
						mainFolder: previousFile.mainFolder,
						fileExtension: path.extname(previousFile.name).length > 1 ? path.extname(previousFile.name).slice(1) : undefined,
						path: previousFile.path
					})
					ipcRenderer.send("changeFile", {
						eventName: "changeTab",
						fileName: previousFile.name,
						path: previousFile.path,
						mainFolder: previousFile.mainFolder,
						fileExtension: path.extname(previousFile.name).length > 1 ? path.extname(previousFile.name).slice(1) : undefined,
						isEdited: previousFile.isEdited,
						value: previousFile.value
					})
				}
		}
	  })
	}
  
	render() {

	var self = this;
	const getSelection = (e) => {
		return e.state.sliceDoc(
		e.state.selection.main.from,
		e.state.selection.main.to)
	}

	const getCoords = (e) => {
		let head = e.state.selection.main.head;
		let cursor = e.state.doc.lineAt(head);
		let cord = { line: e.view.state.doc.lineAt(e.view.state.selection.main.head).number, ch: head - cursor.from }
		let line = document.getElementById("lineID");
		let ch = document.getElementById("chID");
		line.textContent = `Ln ${cord.line}`
		ch.textContent = `Ch ${cord.ch}`
	}
	
  return ( 
    <>
      <div className="bg-white marker:shadow-lg flex flex-col text-sm select-none">
            <main className="bg-dark-700">
              <div className="main-content">
                <div className="bg-discord-1">
                	<CodeMirror
						value={self.state.openFiles.find((p) => p.path === self.state.activeTab) ? self.state.openFiles.find((p) => p.path === self.state.activeTab).value : self.state.value}
						minHeight="50rem"
						ref={self.editor}
						theme={vscodeDark}
						onChange={(e) => {
							let fileIndex = self.state.openFiles?.findIndex((file) => file.path === self.state.activeTab)
							if(self.state.openFiles && self.state.openFiles[fileIndex]) {
								self.state.openFiles[fileIndex] = {
									name: self.state.openFiles[fileIndex]?.name, 
									value: e,
									path: self.state.activeTab,
									isEdited: true
								}
								ipcRenderer.send("fileEdited", self.state.openFiles[fileIndex])
								self.setState({ openFiles: self.state.openFiles })
							} else {
								self.setState({value: e})
							}
						}}
						extensions={extensions[path.extname(self.state.openFiles.find((p) => p.path === self.state.activeTab)?.name || "").slice(1)]}
						onUpdate={getCoords}
					/>
                </div>
              </div>
            </main>
      </div>
    </>
  );
  }
}
