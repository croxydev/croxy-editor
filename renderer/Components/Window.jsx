import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ipcRenderer } from "electron";

import fs from "fs";
import path from "path";
import os from "os";

var home = os.homedir()
var _appPath = path.join(home, 'Documents', 'Croxy Code Editor')

export default class _app extends React.Component {
    constructor(props) {
        super(props)

        this.handleIpc = this.handleIpc.bind(this)
        this.state = {
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

    }
  
    render() {
      var self = this;
      return (
        <nav className="flex items-center justify-between" >
              <div className="bg-discord-1 border-b-2 border-discord-2 marker:shadow-lg h-full w-full text-sm select-none drag">
                  <header className="text-white flex flex-col cursor-default">
                      <section className="flex space-x-1 bg-dark-900 text-gray-300 p-1 pr-0">
                      <nav className="-m-3">
                          <ul className="flex p-2 space-x-2">
                          <li className="w-52 p-2 flex">
                              <img className="h-4 w-4 my-auto mr-2" src="/images/app.png" alt=""/>
                              <a className="p-0.5 hover:bg-opacity-20 hover:bg-white no-drag text-xs cursor-pointer rounded" onClick={() => ipcRenderer.send("openRequest", "folder")}>{self.state.lang["openFolder"]}</a>
                              <a className="p-0.5 hover:bg-opacity-20 hover:bg-white no-drag text-xs cursor-pointer ml-2 rounded" onClick={() => ipcRenderer.send("openRequest", "file")}>{self.state.lang["openFile"]}</a>
                          </li>
                          </ul>
                      </nav>
                      <div className="flex-grow"></div>
                      <button className="text-xs px-4 -m-1 hover:bg-opacity-20 hover:bg-white no-drag" onClick={()=>{ipcRenderer.send('minimize',[])}}>—</button>
                      <button className="text-xs px-4 -m-1 hover:bg-opacity-20 hover:bg-white no-drag" onClick={()=>{ipcRenderer.send('maximize',[])}}>☐</button>
                      <button className="text-xs px-4 -m-1 hover:bg-red-600 no-drag" onClick={()=>{ipcRenderer.send('close',[])}}>✕</button>
                      </section>
                  </header>
              </div>
            </nav>
      );
    }
}