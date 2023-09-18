import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { ipcRenderer } from "electron";
import path from "path";
import fs from "fs";
import os from "os";
var home = os.homedir()
var _appPath = path.join(home, 'Documents', 'Croxy Code Editor')

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  boxShadow: 24,
  p: 4,
};

export default class _app extends React.Component {
  constructor(props) {
      super(props)
      // I put this since I use class based component. 
      // a functional ones won't need this
      this.handleIpc = this.handleIpc.bind(this)
      this.state = {
        activeFile: '',
        files: [],
        saveAlert: {show: false, files: [], file: {}},
        lang: JSON.parse(fs.readFileSync(path.join(_appPath, 'languages', JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json'))).language+".json")))
      };
  }
  componentDidMount() {
      this.handleIpc() // to make sure the ipcRenderer manipulate the component state AFTER the whole component was loaded first
  }

  handleIpc() {
    var self = this

    ipcRenderer.on("languageChanged", function(e, data) {
      self.setState({lang: data.lang})
    })    

    ipcRenderer.on("selectFile", function (e, data) {
      if(!self.state.files?.find(file => file.path === data.path)) {
        self.state.files.push(data)
        self.setState({files: self.state.files})
        self.setState({ activeFile: data.path })
      } else {
        self.setState({ activeFile: data.path })
      }
      ipcRenderer.send("fileSelected", { 
        fileName: data.fileName,
        setRPC: true,
        mainFolder: data.mainFolder,
        fileExtension: path.extname(data.fileName).length > 1 ? path.extname(data.fileName).slice(1) : undefined,
        path: data.path
      })
    })
    ipcRenderer.on("fileEdited", function (e, data) {
      let fileIndex = self.state.files.findIndex((file) => file.path === self.state.activeFile)
      if(self.state.files && self.state.files[fileIndex]) {
        self.state.files[fileIndex] = {
          fileName: self.state.files[fileIndex].fileName, 
          mainFolder: self.state.files[fileIndex].mainFolder,
          path: self.state.activeFile,
          isEdited: true
        }
        self.setState({ files: self.state.files })
      }
    })
    ipcRenderer.on("fileSaved", function (e, data) {
      let fileIndex = self.state.files.findIndex((file) => file.path === self.state.activeFile)
      if(self.state.files && self.state.files[fileIndex]) {
        self.state.files[fileIndex] = {
          fileName: self.state.files[fileIndex].fileName, 
          mainFolder: self.state.files[fileIndex].mainFolder,
          path: self.state.activeFile,
          isEdited: false
        }
        self.setState({ files: self.state.files })
      }
    })
  }

  render() {
    var self = this;
    return (
      <>
      {
        self.state.saveAlert.show === true ? 
        <Modal
          open={self.state.saveAlert.show}
          onClose={(e) => self.setState({saveAlert: { show: false}})}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
        <Box sx={style} className='bg-discord-2 border border-discord-4 rounded'>
          <div>

            <a className="text-gray-300"> {self.state.lang.saveError.info} </a>
            <div className="mt-3 flex flex-row">
              <button className="bg-discord-4 hover:bg-discord-5 text-gray-200 font-bold py-2 px-4 rounded" style={{"whiteSpace": "nowrap"}} onClick={(e) => {
                ipcRenderer.send("saveFile")
                var file = self.state.files.find(x => x.path === self.state.activeFile)
                var previousFile = self.state.files[self.state.files.findIndex(x => x.path === file.path) - 1]
                self.state.files = self.state.files.filter((f) => f.path !== file.path)
                self.setState({files: self.state.files})
                ipcRenderer.send("closeFile", {activeTab: self.state.activeFile, mainFolder: file.mainFolder, path: file.path, fileExtension: path.extname(path.basename(file.path)).length > 1 ? path.extname(path.basename(file.path)).slice(1) : undefined, name: path.basename(file.path)})
                self.setState({activeFile: previousFile?.path})
                self.setState({saveAlert: { content: ''}})
              }}>
                {self.state.lang.saveError.buttons.saveNclose}
              </button>
              <div className="mr-2"></div>
              <button className="bg-discord-4 hover:bg-discord-5 text-gray-200 font-bold py-2 px-4 rounded" style={{"whiteSpace": "nowrap"}} onClick={(e) => {
                var file = self.state.files.find(x => x.path === self.state.activeFile)
                var previousFile = self.state.files[self.state.files.findIndex(x => x.path === file.path) - 1]
                self.state.files = self.state.files.filter((f) => f.path !== file.path)
                self.setState({files: self.state.files})
                ipcRenderer.send("closeFile", {activeTab: self.state.activeFile, mainFolder: file.mainFolder, path: file.path, fileExtension: path.extname(path.basename(file.path)).length > 1 ? path.extname(path.basename(file.path)).slice(1) : undefined, name: path.basename(file.path)})
                self.setState({activeFile: previousFile?.path})
                self.setState({saveAlert: { content: ''}})
              }}>
                {self.state.lang.saveError.buttons.close}
              </button>
              <div className="mr-2"></div>
              <button className="bg-discord-4 hover:bg-discord-5 text-gray-200 font-bold py-2 px-4 rounded" style={{"whiteSpace": "nowrap"}} onClick={(e) => {
                self.setState({saveAlert: { content: ''}})
              }}>
                {self.state.lang.saveError.buttons.closeMenu}
              </button>
            </div>
          </div>
        </Box>
      </Modal> : <></>
      }
      <div className="flex items-center border-discord-2 bg-discord-1 overflow-auto select-none">
          {self.state.files.map((file) => {
            return (<div key={file.path} id={file.path} onClick={(e) => {
              e.preventDefault();
              if(e.target.id.length === 0) return;
              self.setState({ activeFile: file.path })
              ipcRenderer.send("changeFile", {path: file.path, mainFolder: file.mainFolder, fileExtension: path.extname(path.basename(file.path)).length > 1 ? path.extname(path.basename(file.path)).slice(1) : undefined, name: path.basename(file.path)})
            }} className={`flex text-lg font-semibold text-gray-100 ${self.state.activeFile === file.path ? "bg-discord-4 border border-discord-4 " : "border border-discord-1 hover:bg-discord-3"} text-sm p-1 px-6 text-gray-300 font-normal hover:cursor-pointer w-full`} style={{"whiteSpace": "nowrap"}}>
            {file.fileName}
            <a id={`${file.path}_CLOSEBUTTON`} className="ml-5 -mr-3 w-full" onClick={(e) => {
              e.preventDefault();
              if(file.isEdited) {
                self.setState({saveAlert: { 
                  show: true,
                  files: self.state.files,
                  file: file
                }})
              } else {
                var previousFile = self.state.files[self.state.files.findIndex(x => x.path === file.path) - 1]
                self.state.files = self.state.files.filter((f) => f.path !== file.path)
                self.setState({files: self.state.files})
                ipcRenderer.send("closeFile", {activeTab: self.state.activeFile, mainFolder: file.mainFolder, path: file.path, fileExtension: path.extname(path.basename(file.path)).length > 1 ? path.extname(path.basename(file.path)).slice(1) : undefined, name: path.basename(file.path)})
                self.setState({activeFile: previousFile?.path})
              }
            }}>
              {
                file.isEdited ? <div className="shadow-sm bg-gray-300 hover:bg-gray-400 mt-1 mr-2 w-3 h-3 rounded-full"></div> : <svg className="h-5 w-5 text-gray-300 hover:bg-red-600 rounded"  width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">  <path stroke="none" d="M0 0h24v24H0z"/>  <line x1="18" y1="6" x2="6" y2="18" />  <line x1="6" y1="6" x2="18" y2="18" /></svg>
              }
            </a>
          </div>)
          })}
      </div>
      </>
    )
  }
}