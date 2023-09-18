import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'

import Sidebar from "../Components/Sidebar"
import Tabs from "../Components/Tabs"
import Window from "../Components/Window"
import ToolsBar from "../Components/ToolsBar"
import ResizeBarRL from "../Components/ResizeBarRL"
import Footer from "../Components/Footer"
import dynamic from 'next/dynamic'
import { ipcRenderer, remote } from "electron";
import electron from 'electron';
import AppName from "../Components/AppName"
const Editor = dynamic(
	() => import('../Components/Editor'),
	{ ssr: false }
)

export default function Home() {
	React.useEffect(() => {
		require("../utils/document-listeners.js")
	}, [])
	return (
		<div className="flex flex-col h-screen w-screen bg-discord-5">
			<AppName/>
			<Window/>
			<div className="flex flex-1 overflow-hidden" >
				
				<ToolsBar/>
				<Sidebar/>
				<ResizeBarRL/>
				<div className="flex flex-col flex-1 overflow-hidden" >
					<div className="flex items-center" >
						<Tabs/>
					</div>
					<div className="flex-1 overflow-y-auto" >
						<Editor/>
					</div>
      			</div>
				
			</div>
			<Footer/>
		</div>
	)
}