import { ipcRenderer, remote } from "electron";
import electron from 'electron';
        
        var dragFolders = document.getElementById("sidebar")

		dragFolders.addEventListener("dragover", (e) => {
			e.stopPropagation();
			e.preventDefault();
		})

		dragFolders.addEventListener("drop", (e) => {
			e.stopPropagation();
			e.preventDefault();


			let pathArr = [];
			for (const f of e.dataTransfer.files) {
				pathArr.push({name: f.name, path: f.path});
			}

			ipcRenderer.send('drop', pathArr);
		})

		document.addEventListener('keyup', (e) => {  
			if (e.ctrlKey && (e.key === 'k')) {
				ipcRenderer.send("openRequest", "folder")
			} else if ((e.ctrlKey) && e.key === 'o') {
				ipcRenderer.send("openRequest", "file")
			} else if ((e.ctrlKey) && e.key === 's') {
				ipcRenderer.send("saveFile")
			}  
		  })