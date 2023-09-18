import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { FaFile, FaCog } from "react-icons/fa";

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';

import fs from "fs";
import path from "path";
import os from "os";
import { ipcRenderer } from 'electron';

var home = os.homedir()
var _appPath = path.join(home, 'Documents', 'Croxy Code Editor')

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
        
        this.langs = fs.readdirSync(path.join(_appPath, 'languages'))
        this.langsText = this.langs.map((l) => JSON.parse(fs.readFileSync(path.join(_appPath, 'languages', l))).name);
        
        this.handleIpc = this.handleIpc.bind(this)
        this.state = {
          settingsModal: false,
          settings: JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json'))),
          langCode: JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json'))).language,
          rpc: JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json'))).discordRPC,
          lang: JSON.parse(fs.readFileSync(path.join(_appPath, 'languages', JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json'))).language+".json")))
        };
    }

    setLanguage(lang) {
        console.log(lang)
        var self = this;
        this.setState({langCode: lang})
        this.setState({lang: JSON.parse(fs.readFileSync(path.join(_appPath, 'languages', lang+".json")))})
        fs.writeFileSync(path.join(_appPath, 'settings.json'), JSON.stringify({
            lastFiles: JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json'))).lastFiles,
            lastActiveFile: JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json'))).lastActiveFile,
            lastFolder: JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json'))).lastFolder,
            discordRPC: JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json'))).discordRPC,
            language: lang
        }))

        ipcRenderer.send("languageChanged", lang)
    }

    setRPC(bool) {
        fs.writeFileSync(path.join(_appPath, 'settings.json'), JSON.stringify({
          lastFiles: JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json'))).lastFiles,
          lastActiveFile: JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json'))).lastActiveFile,
          lastFolder: JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json'))).lastFolder,
          discordRPC: bool,
          language: JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json'))).language
        }))
  
        this.setState({rpc: bool})
        bool === false ? ipcRenderer.send('RPCLogout',[]) : ipcRenderer.send('RPCLogin',[])
    }

    componentDidMount() {
        this.handleIpc() // to make sure the ipcRenderer manipulate the component state AFTER the whole component was loaded first
    }
  
    handleIpc() {
      var self = this
  
    }
  
    render() {
      var self = this;
        return (
            <>
            <Modal
                open={self.state.settingsModal}
                onClose={(e) => self.setState({settingsModal: false})}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={style} className='bg-discord-2 border border-discord-4 rounded'>
                <div>
                    <div className="flex justify-center items-center">
                        <a className="font-lg text-bold uppercase text-gray-300 select-none justify-center">{self.state.lang["settings"]}</a>
                    </div>
                    <div className="mt-4"></div>
                    <div className="flex flex-row justify-between p-4">
                        <a className="font-lg text-semibold text-gray-200 select-none text-center">Discord RPC</a>
                        <label className='flex cursor-pointer select-none items-center'>
                            <div className='relative'>
                            <input
                                type='checkbox'
                                checked={self.state.rpc}
                                className='sr-only'
                                onChange={(e) => {
                                    e.preventDefault()
                                    self.setRPC(!self.state.rpc)
                                }}
                            />
                            <div
                                className={`box block h-8 w-14 rounded-full ${
                                    self.state.rpc ? 'bg-blue-600' : 'bg-discord-4'
                                }`}
                            ></div>
                            <div
                                className={`absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white transition ${
                                    self.state.rpc ? 'translate-x-full' : ''
                                }`}
                            ></div>
                            </div>
                        </label>
                    </div>
                    <div className="mt-4"></div>
                    <div className="flex flex-row justify-between p-4">
                        <a className="font-lg text-semibold text-gray-200 select-none text-center">{self.state.lang["language"]}</a>
                        <select value={self.state.langCode}
                            onChange={e => self.setLanguage(e.target.value)} id="languages" className="border-discord-4 bg-discord-1 rounded p-1 text-gray-200 focus-none">
                            {self.langsText.map((lang, index) => {
                                return <option key={index} value={self.langs[index].split(".").shift()}>{lang}</option>
                            })}
                        </select>
                    </div>
                    
                </div>
                </Box>
            </Modal>
            <aside className="w-13 border-r-2 border-discord-2 bg-discord-1 overflow-auto" >
                <nav className="flex flex-col gap-4" >
                    <div className="border-l-2 p-3 border-blue-700 cursor-pointer">
                        <h2 className="text-lg font-semibold" >
                            <FaFile className="h-7 w-7 text-gray-300 hover:text-white" />
                        </h2>
                    </div>
                    <div className="border-l-2 p-3 border-discord-1 cursor-pointer" onClick={(e) => {
                        self.setState({settingsModal: !self.state.settingsModal })
                    }}>
                        <h2 className="text-lg font-semibold" >
                            <FaCog className="h-7 w-7 text-gray-300 hover:text-white" />
                        </h2>
                    </div>
                </nav>
            </aside>
            </>
            
        )
    }
};