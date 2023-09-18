import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import $ from "jquery"
import { useEffect } from "react";
//import ListFolders from "../utils/ListFolders"
//import Files from "../config/files";
import TreeView, { flattenTree } from "react-accessible-treeview";
import { faFolderOpen, faFolder, faCode } from "@fortawesome/free-solid-svg-icons";
import { FaFileCode } from "react-icons/fa";
import { IoMdArrowDropright } from "react-icons/io";
import { JavascriptOriginal, NpmOriginalWordmark, Css3Original, TypescriptOriginal, Html5Original, PhpOriginal, VuejsOriginal, LuaOriginal, JavaOriginal, PythonOriginal } from 'devicons-react'
import { ipcRenderer } from "electron";
import path from "path";
import { Menu, Item, useContextMenu } from 'react-contexify';
import 'react-contexify/ReactContexify.css';
import fs from "fs";
import os from "os";

var home = os.homedir()
var _appPath = path.join(home, 'Documents', 'Croxy Code Editor')

export default class _app extends React.Component {
	constructor(props) {
		super(props)

		this.handleIpc = this.handleIpc.bind(this)
		this.state = {
		  folders: flattenTree([]),
		  watcher: null,
		  lang: JSON.parse(fs.readFileSync(path.join(_appPath, 'languages', JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json'))).language+".json")))
		};
	}
	componentDidMount() {
		this.handleIpc()
	}
  
	handleIpc() {
	var settings = JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json')))
	if(settings.lastFolder.length !== 0) {
		ipcRenderer.send("drop", {
			path: settings.lastFolder,
			name: path.basename(settings.lastFolder)
		})
	}
	  var self = this
	  ipcRenderer.on("languageChanged", function(e, data) {
		self.setState({lang: data.lang})
	  })
	  ipcRenderer.on("openFolder", function (e, data) {
		let folders = flattenTree(data)
		console.log(self.state.folders[0].metadata)
		if(self.state.watcher !== null) self.state.watcher.close();
		function watch(dir, config) {
			return fs.watch(dir, {
			  persistent: true,
			  recursive: true
			}, function(event, filename) {
			  if (filename) {
				ipcRenderer.send("folderChanged", {
					path: Object.values(folders[0].metadata).join(""),
					name: path.basename(Object.values(folders[0].metadata).join(""))
				})
			  }
			});
		}
		let watcher = watch(path.normalize(Object.values(folders[0].metadata).join("")));
		self.setState({watcher: watcher})
		self.setState({folders: folders})
	  })

	  ipcRenderer.on("folderChanged", function (e, data) {
		let folders = flattenTree(data)
		if(self.state.folders[0].metadata !== undefined) fs.unwatchFile(path.normalize(Object.values(self.state.folders[0].metadata).join("")))
		self.setState({folders: folders})
	  })

	}
  
	render() {
	var self = this;
	
	const emptyBarMenu = useContextMenu({
		id: "sidebar",
	});
	
	function handleEmptyMenu(event, props){
		emptyBarMenu.show({
			event,
			props
		  })
	}

	return (
		<>
			<aside id="sidebar" onContextMenu={handleEmptyMenu} className="w-64 overflow-auto cursor-default select-none break-keep" >
				<nav className="flex flex-col" >
					<div className="directory">
						<TreeView
						data={self.state.folders}
						aria-label="directory tree"
						onNodeSelect={(e) => {
							e.element.mainFolder = self.state.folders[0].name;
							ipcRenderer.send("fileSelected", e.element)
							ipcRenderer.send("changeFile", {
								eventName: "changeFile",
								fileName: e.element.name,
								mainFolder: self.state.folders[0].name,
								fileExtension: path.extname(e.element.name).length > 1 ? path.extname(e.element.name).slice(1) : undefined,
								path: Object.values(e.element.metadata).join("")
							})
						}}
						nodeRenderer={({
							element,
							isBranch,
							isExpanded,
							getNodeProps,
							level,
						}) => (
							<div {...getNodeProps()} style={{ paddingLeft: 20 * (level - 1) }}>
							<div className='flex flex-row p-1 text-gray-300'>
							{isBranch ? 
								<><ArrowIcon isOpen={isExpanded} /></>
							: (
								<div className="mt-0.5">
									<Icon filename={element.name} />
								</div>
							)}

							<a className="ml-1">{element.name}</a>
							</div>
							</div>
						)}
						/>
					</div>
				</nav>
			</aside>
			{
				self.state.folders.length <= 1 ?
				<Menu id="sidebar" theme='dark'>
					<Item id="openFolder" onClick={(e) => {
						ipcRenderer.send("openRequest", "folder")
					}}>{self.state.lang["openFolder"]}</Item>
					<Item id="openFile" onClick={(e) => {
						ipcRenderer.send("openRequest", "file")
					}}>{self.state.lang["openFile"]}</Item>
				</Menu>
				:
				<></>
			}
			
		</>
	)
	}
};

const ArrowIcon = ({ isOpen }) => {
	const baseClass = "arrow";
	let classes = isOpen ? `${baseClass}--open` : `${baseClass}-closed`
	classes += " mt-1 text-gray-400 transition ease-in-out delay-50"
	return <IoMdArrowDropright className={classes} />;
};

const FolderIcon = ({ isOpen }) =>
  isOpen ? (
    <FontAwesomeIcon icon={faFolderOpen} className="text-yellow-300 icon"/>
  ) : (
    <FontAwesomeIcon icon={faFolder} className="text-yellow-300 icon" />
  );

const Icon = ({ filename }) => {
  const extension = filename.slice(filename.lastIndexOf(".") + 1);
  switch (extension) {
    case "js":
      return <JavascriptOriginal color="yellow" className="icon" />;
    case "css":
      return <Css3Original color="turquoise" className="icon" />;
    case "json":
      return <MdiCodeBraces className="text-yellow-300" />;
    case "npmignore":
      return <NpmOriginalWordmark color="red" className="icon" />;
	case "ts":
		return <TypescriptOriginal color="turquoise" className="icon" />;
	case "tsx":
		return <MdiReact className="text-blue-600" />;
	case "jsx":
		return <MdiReact className="text-yellow-300" />;
	case "md":
		return <MdiLanguageMarkdown className="text-blue-400" />;
	case "html":
		return <Html5Original className="icon" />;
	case "php":
		return <PhpOriginal className="icon" />;
	case "vue":
		return <VuejsOriginal className="icon" />;
	case "lua":
		return <LuaOriginal className="icon" />;
	case "java":
		return <JavaOriginal className="icon" />;
	case "py":
		return <PythonOriginal className="icon" />;
    default:
      return <FaFileCode color="gray" className="icon" />;
  }
};


function MdiCodeBraces(props) {
	return (
	  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}><path fill="currentColor" d="M8 3a2 2 0 0 0-2 2v4a2 2 0 0 1-2 2H3v2h1a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2h2v-2H8v-5a2 2 0 0 0-2-2a2 2 0 0 0 2-2V5h2V3m6 0a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2h1v2h-1a2 2 0 0 0-2 2v4a2 2 0 0 1-2 2h-2v-2h2v-5a2 2 0 0 1 2-2a2 2 0 0 1-2-2V5h-2V3h2Z"></path></svg>
	)
}


function MdiReact(props) {
	return (
	  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}><path fill="currentColor" d="M12 10.11c1.03 0 1.87.84 1.87 1.89c0 1-.84 1.85-1.87 1.85c-1.03 0-1.87-.85-1.87-1.85c0-1.05.84-1.89 1.87-1.89M7.37 20c.63.38 2.01-.2 3.6-1.7c-.52-.59-1.03-1.23-1.51-1.9a22.7 22.7 0 0 1-2.4-.36c-.51 2.14-.32 3.61.31 3.96m.71-5.74l-.29-.51c-.11.29-.22.58-.29.86c.27.06.57.11.88.16l-.3-.51m6.54-.76l.81-1.5l-.81-1.5c-.3-.53-.62-1-.91-1.47C13.17 9 12.6 9 12 9c-.6 0-1.17 0-1.71.03c-.29.47-.61.94-.91 1.47L8.57 12l.81 1.5c.3.53.62 1 .91 1.47c.54.03 1.11.03 1.71.03c.6 0 1.17 0 1.71-.03c.29-.47.61-.94.91-1.47M12 6.78c-.19.22-.39.45-.59.72h1.18c-.2-.27-.4-.5-.59-.72m0 10.44c.19-.22.39-.45.59-.72h-1.18c.2.27.4.5.59.72M16.62 4c-.62-.38-2 .2-3.59 1.7c.52.59 1.03 1.23 1.51 1.9c.82.08 1.63.2 2.4.36c.51-2.14.32-3.61-.32-3.96m-.7 5.74l.29.51c.11-.29.22-.58.29-.86c-.27-.06-.57-.11-.88-.16l.3.51m1.45-7.05c1.47.84 1.63 3.05 1.01 5.63c2.54.75 4.37 1.99 4.37 3.68c0 1.69-1.83 2.93-4.37 3.68c.62 2.58.46 4.79-1.01 5.63c-1.46.84-3.45-.12-5.37-1.95c-1.92 1.83-3.91 2.79-5.38 1.95c-1.46-.84-1.62-3.05-1-5.63c-2.54-.75-4.37-1.99-4.37-3.68c0-1.69 1.83-2.93 4.37-3.68c-.62-2.58-.46-4.79 1-5.63c1.47-.84 3.46.12 5.38 1.95c1.92-1.83 3.91-2.79 5.37-1.95M17.08 12c.34.75.64 1.5.89 2.26c2.1-.63 3.28-1.53 3.28-2.26c0-.73-1.18-1.63-3.28-2.26c-.25.76-.55 1.51-.89 2.26M6.92 12c-.34-.75-.64-1.5-.89-2.26c-2.1.63-3.28 1.53-3.28 2.26c0 .73 1.18 1.63 3.28 2.26c.25-.76.55-1.51.89-2.26m9 2.26l-.3.51c.31-.05.61-.1.88-.16c-.07-.28-.18-.57-.29-.86l-.29.51m-2.89 4.04c1.59 1.5 2.97 2.08 3.59 1.7c.64-.35.83-1.82.32-3.96c-.77.16-1.58.28-2.4.36c-.48.67-.99 1.31-1.51 1.9M8.08 9.74l.3-.51c-.31.05-.61.1-.88.16c.07.28.18.57.29.86l.29-.51m2.89-4.04C9.38 4.2 8 3.62 7.37 4c-.63.35-.82 1.82-.31 3.96a22.7 22.7 0 0 1 2.4-.36c.48-.67.99-1.31 1.51-1.9Z"></path></svg>
	)
}


function MdiLanguageMarkdown(props) {
	return (
	  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}><path fill="currentColor" d="M20.56 18H3.44C2.65 18 2 17.37 2 16.59V7.41C2 6.63 2.65 6 3.44 6h17.12c.79 0 1.44.63 1.44 1.41v9.18c0 .78-.65 1.41-1.44 1.41M6.81 15.19v-3.66l1.92 2.35l1.92-2.35v3.66h1.93V8.81h-1.93l-1.92 2.35l-1.92-2.35H4.89v6.38h1.92M19.69 12h-1.92V8.81h-1.92V12h-1.93l2.89 3.28L19.69 12Z"></path></svg>
	)
}