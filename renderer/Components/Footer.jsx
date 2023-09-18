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
          lang: JSON.parse(fs.readFileSync(path.join(_appPath, 'languages', JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json'))).language+".json"))),
          rpc: JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json'))).discordRPC
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
        <footer
        className="flex items-center justify-between"
      >
      <div className="text-sm select-none w-full">
            <footer className="text-white cursor-default">
                <section className="flex space-x-1 bg-blue-700 text-gray-300">
                <nav>
                    <ul className="flex">
                    <span className="text-xs px-4 p-1 hover:bg-opacity-10 hover:bg-white no-drag cursor-pointer" onClick={()=>{
                    }}>{self.state.rpc ? self.state.lang.connectedToDiscord : self.state.lang.notConnectedToDiscord}</span>
                    </ul>
                </nav>
                <div className="flex-grow"></div>
                <span className="text-xs px-4 p-1 hover:bg-opacity-10 hover:bg-white no-drag cursor-pointer"><a id="lineID">Ln 0</a>, <a id="chID">Ch 0</a></span>
                <span className="text-xs px-4 p-1 hover:bg-opacity-10 hover:bg-white no-drag cursor-pointer">{self.state.lang.spaces}: 2</span>
                </section>
            </footer>
        </div>
      </footer>
      );
   }
}