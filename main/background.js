import { app } from 'electron';
import serve from 'electron-serve';
import { createWindow } from './helpers';
import { ipcMain, nativeImage } from "electron";
import DiscordRPC from 'discord-rpc';
import http from "http";
import * as WebSocket from "ws";
import path from "path"
import * as electron from "electron";
import fs from "fs";
import files from "./config/files.js";
import os from "os";

let appIcon = nativeImage.createFromPath(path.join(process.cwd(), 'main', 'icons', 'app.png'));

const port = 2121;
const server = http.createServer();
const wss = new WebSocket.Server({ server });

const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
  serve({ directory: 'app' });
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`);
}

let opened_at = Date.now();

(async () => {
  await app.whenReady();
  const mainWindow = createWindow('main', {
    width: 1000,
    height: 600,
    icon: appIcon,
    preload: path.join(process.cwd(), 'main', 'preload.js'),
    title: "Croxy Code Editor",
    minHeight: 600,  
    titleBarStyle: 'hidden',
    minWidth: 1000,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false,
      contextIsolation: false 
    }
  });
  mainWindow.setMenuBarVisibility(false)
  var home = os.homedir()
  var _appPath = path.join(home, 'Documents', 'Croxy Code Editor')
  if (!fs.existsSync(_appPath)) fs.mkdirSync(_appPath);

  var appPath = fs.readdirSync(_appPath)
  if(["settings.json", "themes", "plugins"].includes(appPath) === false) {
    if(!fs.existsSync(path.join(_appPath, 'themes'))) fs.mkdirSync(path.join(_appPath, 'themes'))
    if(!fs.existsSync(path.join(_appPath, 'plugins'))) fs.mkdirSync(path.join(_appPath, 'plugins'))
    if(!fs.existsSync(path.join(_appPath, 'languages'))) fs.mkdirSync(path.join(_appPath, 'languages'))
    if(!fs.existsSync(path.join(_appPath, 'settings.json'))) fs.writeFileSync(path.join(_appPath, 'settings.json'), JSON.stringify({
      lastFiles: [],
      lastActiveFile: '',
      lastFolder: '',
      discordRPC: false,
      language: 'en'
    }))
    if(!fs.existsSync(path.join(_appPath, 'languages', 'en.json'))) fs.writeFileSync(path.join(_appPath, 'languages', 'en.json'), JSON.stringify({
      name: "English",
      openFile: "Open File",
      openFolder: "Open Folder",
      connectedToDiscord: "Connected to Discord",
      notConnectedToDiscord: "Not Connected to Discord",
      spaces: "Spaces",
      settings: "Settings",
      language: "Language",
      saveError: {
        info: "Do you want to close without saving? If you close without saving, all changes will be deleted.",
        buttons: {
          "saveNclose": "Save & Close",
          "close": "Close",
          "closeMenu": "Close Menu"
        }
      }
    }))
    if(!fs.existsSync(path.join(_appPath, 'languages', 'tr.json'))) fs.writeFileSync(path.join(_appPath, 'languages', 'tr.json'), JSON.stringify({
      name: "Türkçe",
      openFile: "Dosya Aç",
      openFolder: "Klasör Aç",
      connectedToDiscord: "Discord'a Bağlı",
      notConnectedToDiscord: "Discord'a Bağlı Değil",
      spaces: "Boşluklar",
      settings: "Ayarlar",
      language: "Dil",
      saveError: {
        info: "Kaydetmeden kapatmak istiyor musun? Kaydetmeden kapatırsan, yaptığın bütün değişiklikler silinir.",
        buttons: {
          "saveNclose": "Kaydet ve Kapat",
          "close": "Kapat",
          "closeMenu": "Menüyü Kapat"
        }
      }
    }))
  }

  if (isProd) {
    await mainWindow.loadURL('app://./home.html');
  } else {
    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:${port}/home`);
  }
  
  ipcMain.on('minimize',()=>mainWindow.minimize())
  ipcMain.on('maximize',()=>{ 
    mainWindow.maximize()
  })

  ipcMain.on('fileEdited', (event, data) => {       
    event.reply("fileEdited", data)
  });

  ipcMain.on('drop', (event, arg) => {
    arg = arg[0] ? arg[0] : arg
    try {
      if(fs.statSync(arg.path).isDirectory()) {
        let data = [];
        function createDirectoryItem(name, fullpath) {
          let resultt = new Object({
            name,
            metadata: fullpath,
            isFolder: (fs.statSync(fullpath).isDirectory()),
            mainFolder: path.basename(arg.path),
            children: []
          });
      
          let files = fs.statSync(fullpath).isDirectory() ? fs.readdirSync(fullpath) : [];
          for(var file of files) {
            if(!path.join(fullpath, file).includes("node_modules")) resultt.children.push(createDirectoryItem(file, path.join(fullpath, file)))
          }
          
          resultt.children = resultt.children.sort((a, b) => (b.isFolder ? 1 : 0) - (a.isFolder ? 1 : 0) )
          return resultt;
        };
        fs.readdir(arg.path, 'utf-8', (err, dir) => {
          for(let name of dir) {
            let fullpath = path.join(arg.path, name);
            if(!fullpath.includes("node_modules")) data.push(createDirectoryItem(name, fullpath));
          }
          event.reply("openFolder", {isFolder: true, metadata: arg.path, name: path.basename(arg.path), children: [{isFolder: true, metadata: arg.path, name: path.basename(arg.path), children: data.sort((a, b) => (b.isFolder ? 1 : 0) - (a.isFolder ? 1 : 0) )}]})
          fs.writeFileSync(path.join(_appPath, 'settings.json'), JSON.stringify({
            lastFiles: JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json'))).lastFiles,
            lastActiveFile: JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json'))).lastActiveFile,
            lastFolder: arg.path,
            discordRPC: JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json'))).discordRPC,
            language: JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json'))).language
          }))
        })
      } else {
        let files = JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json'))).lastFiles
        if(!files.includes(arg.path)) {
          files.push(arg.path)
          fs.writeFileSync(path.join(_appPath, 'settings.json'), JSON.stringify({
            lastFiles: files,
            lastActiveFile: arg.path,
            lastFolder: JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json'))).lastFolder,
            discordRPC: JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json'))).discordRPC,
            language: JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json'))).language
          }))
        }
        event.reply("selectFile", {path: arg.path, mainFolder: "Unknown", fileName: arg.name, value: fs.readFileSync(path.normalize(arg.path)).toString()})
        event.reply("openFile", {autoOpen: arg.autoOpen, path: arg.path, mainFolder: "Unknown", name: arg.name, value: fs.readFileSync(path.normalize(arg.path)).toString()})
      }
    } catch(err) {
      
    }
  })

  const clientId = '757017696570310716';

  const rpc = new DiscordRPC.Client({ transport: 'ipc' });

  async function setActivity() {
    if (!rpc) {
      return;
    }

    // You'll need to have snek_large and snek_small assets uploaded to
    // https://discord.com/developers/applications/<application_id>/rich-presence/assets
    rpc.setActivity({
      largeImageKey: "app",
      largeImageText: "Croxy Code Editor",
      startTimestamp: opened_at,
      instance: true
    });
  }

  if(JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json'))).discordRPC) {
    rpc.login({ clientId }).catch(console.error);
  }

  ipcMain.on("openRequest", async(e, type) => {
    if(type === "folder") {
      var result = await electron.dialog.showOpenDialog({ properties: [ 'openDirectory'] })
      result = result.filePaths.length === 0 ? undefined : result.filePaths[0]
		  if(!result) return;
      let data = [];
      function createDirectoryItem(name, fullpath) {
        let resultt = new Object({
          name,
          metadata: fullpath,
          isFolder: (fs.statSync(fullpath).isDirectory()),
          mainFolder: path.basename(result),
          children: []
        });
    
        let files = fs.statSync(fullpath).isDirectory() ? fs.readdirSync(fullpath) : [];
        for(var file of files) {
          if(!path.join(fullpath, file).includes("node_modules")) resultt.children.push(createDirectoryItem(file, path.join(fullpath, file)))
        }
        
        resultt.children = resultt.children.sort((a, b) => (b.isFolder ? 1 : 0) - (a.isFolder ? 1 : 0) )
        return resultt;
      };
      fs.readdir(result, 'utf-8', (err, dir) => {
        for(let name of dir) {
          let fullpath = path.join(result, name);
          if(!fullpath.includes("node_modules")) data.push(createDirectoryItem(name, fullpath));
        }
        e.reply("openFolder", {isFolder: true, metadata: result, name: path.basename(result), children: [{isFolder: true, metadata: result, name: path.basename(result), children: data.sort((a, b) => (b.isFolder ? 1 : 0) - (a.isFolder ? 1 : 0) )}]})
        fs.writeFileSync(path.join(_appPath, 'settings.json'), JSON.stringify({
          lastFiles: JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json'))).lastFiles,
          lastActiveFile: JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json'))).lastActiveFile,
          lastFolder: result,
          discordRPC: JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json'))).discordRPC,
          language: JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json'))).language
        }))          
      })
    } else if(type === "file") {
      var result = await electron.dialog.showOpenDialog({ properties: [ 'openFile' ] })
      result = result.filePaths.length === 0 ? undefined : result.filePaths[0]
		  if(!result) return;
      e.reply("selectFile", {path: result, mainFolder: "Unknown", fileName: path.basename(result), value: fs.readFileSync(path.normalize(result)).toString()})
      e.reply("openFile", {path: result, mainFolder: "Unknown", name: path.basename(result), value: fs.readFileSync(path.normalize(result)).toString()})
      let files = JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json'))).lastFiles
      if(!files.includes(result)) {
        files.push(result)
        fs.writeFileSync(path.join(_appPath, 'settings.json'), JSON.stringify({
          lastFiles: files,
          lastActiveFile: result,
          lastFolder: JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json'))).lastFolder,
          discordRPC: JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json'))).discordRPC,
          language: JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json'))).language
        }))
      }
    } 
  })

  ipcMain.on("changeFile", (event, file) => {
    if(fs.statSync(path.normalize(file.path)).isDirectory()) return;
    var result = fs.readFileSync(path.normalize(file.path))
    if(!result) return;
    let files = JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json'))).lastFiles
    if(!files.includes(file.path)) {
      files.push(file.path)
      fs.writeFileSync(path.join(_appPath, 'settings.json'), JSON.stringify({
        lastFiles: files,
        lastFolder: JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json'))).lastFolder,
        discordRPC: JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json'))).discordRPC,
        language: JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json'))).language
      }))
    }
    fs.writeFileSync(path.join(_appPath, 'settings.json'), JSON.stringify({
      lastFiles: JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json'))).lastFiles,
      lastActiveFile: file.path,
      lastFolder: JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json'))).lastFolder,
      discordRPC: JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json'))).discordRPC,
      language: JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json'))).language
    }))
    event.reply("openFile", {path: file.path, mainFolder: file.mainFolder, name: path.basename(file.path), value: file.eventName === "changeTab" ? file.value : result.toString()})
  })

  ipcMain.on("closeFile", (event, file) => {
    if(fs.statSync(path.normalize(file.path)).isDirectory()) return;
    event.reply("closeFile", {activeTab: file.activeTab, mainFolder: file.mainFolder, path: file.path, name: path.basename(file.path), value: (file.activeTab ? undefined : '')})
    let files = JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json'))).lastFiles
    var previousFile = files[files.findIndex(x => x.path === file.path) - 1]
      files = files.filter((f) => f !== file.path)
      fs.writeFileSync(path.join(_appPath, 'settings.json'), JSON.stringify({
        lastFiles: files,
        lastActiveFile: previousFile ? previousFile : '',
        lastFolder: JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json'))).lastFolder,
        discordRPC: JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json'))).discordRPC,
        language: JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json'))).language
      }))
  })

  ipcMain.on("saveFile", (event, file) => {
    event.reply("saveFile", {})
  })

  ipcMain.on("saveNewFile", async(event, file) => {
    var path = await electron.dialog.showSaveDialogSync();
    console.log(path)
    event.reply("saveFile", path)
  })

  ipcMain.on("saveSettings", (event, settings) => {
    fs.writeFileSync(path.join(_appPath, 'settings.json'), JSON.stringify({
      lastFiles: JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json'))).lastFiles,
      lastActiveFile: JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json'))).lastActiveFile,
      lastFolder: JSON.parse(fs.readFileSync(path.join(_appPath, 'settings.json'))).lastFolder,
      discordRPC: settings.discordRPC,
      language: settings.language,
    }))
  })

  ipcMain.on("languageChanged", async(event, lang) => {
    event.reply("languageChanged", {
      langCode: lang,
      lang: JSON.parse(fs.readFileSync(path.join(_appPath, 'languages', lang+".json")))
    })
  })

  ipcMain.on("folderChanged", async(event, results) => {
    let result = results.path
      let data = [];
      if(!fs.existsSync(result)) return event.reply("folderChanged", {isFolder: false, metadata: undefined, name: undefined, children: []})
        function createDirectoryItem(name, fullpath) {
          let resultt = new Object({
            name,
            metadata: fullpath,
            isFolder: (fs.statSync(fullpath).isDirectory()),
            mainFolder: path.basename(result),
            children: []
          });
      
          let files = fs.statSync(fullpath).isDirectory() ? fs.readdirSync(fullpath) : [];
          for(var file of files) {
            if(!path.join(fullpath, file).includes("node_modules")) resultt.children.push(createDirectoryItem(file, path.join(fullpath, file)))
          }
          
          resultt.children = resultt.children.sort((a, b) => (b.isFolder ? 1 : 0) - (a.isFolder ? 1 : 0) )
          return resultt;
        };
        fs.readdir(result, 'utf-8', (err, dir) => {
          for(let name of dir) {
            let fullpath = path.join(result, name);
            if(!fullpath.includes("node_modules")) data.push(createDirectoryItem(name, fullpath));
          }       
          event.reply("folderChanged", {isFolder: true, metadata: result, name: path.basename(result), children: [{isFolder: true, metadata: result, name: path.basename(result), children: data.sort((a, b) => (b.isFolder ? 1 : 0) - (a.isFolder ? 1 : 0) )}]})
        })
  })

  ipcMain.on("fileSaved", (event, file) => {
    event.reply("fileSaved", file)
  })

  ipcMain.on('fileSelected',(event, element)=>{
    if(element.setRPC === true) {
      let data = element;
      let presence;
      if(element.fileClosed === true) {
        presence = {
          largeImageKey: "app",
          largeImageText: "Croxy Code Editor",
          startTimestamp: opened_at,
          instance: true
        }
      } else {
        presence = {
          largeImageKey: files[data.fileExtension] ? data.fileExtension : "file",
          smallImageKey: "app",
          largeImageText: `Editing a ${files[data.fileExtension] ? files[data.fileExtension].toUpperCase() +" file" : "file"}`,
          smallImageText: "Croxy Code Editor",
          instance: true,
          startTimestamp: opened_at,
          details: "Editing: {file}".replace("{file}", data.fileName),
          state: "Project: {workspace}".replace("{workspace}", data.mainFolder),
        }
      }
      rpc.setActivity({...presence})
    } else {
      let data = { 
        eventName: "selectFile",
        fileName: element.name,
        mainFolder: element.mainFolder,
        fileExtension: path.extname(element.name).length > 1 ? path.extname(element.name).slice(1) : undefined,
        path: Object.values(element.metadata).join("")
      } 
      if(fs.statSync(path.normalize(data.path)).isDirectory() === false) {
        mainWindow.title = `${data.fileName} - Croxy Code Editor`
        event.reply("selectFile", data)
      }
    }
  })

  ipcMain.on('RPCLogin',()=>{ 
    setActivity();
  })
  ipcMain.on('RPCLogout',()=>{ 
    rpc.clearActivity();
  })

  ipcMain.on('close',()=>{
    rpc.destroy().catch(console.error);
    app.quit()
  })  

})();
app.on('window-all-closed', () => { 
  app.quit();
});

//start our server
server.listen(port, () => {
  console.log(`HTTP Server started for Croxy Code Editor on port ${port}`);
});