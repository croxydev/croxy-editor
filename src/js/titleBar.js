const remote = require('electron').remote;

var quit = document.getElementById("quit");
var minimise = document.getElementById("minimise");
var maximise = document.getElementById("maximise");


quit.addEventListener("click",closeWindow);
minimise.addEventListener("click",minimiseWindow);
maximise.addEventListener("click",maximiseWindow);

function closeWindow(){
	 remote.getCurrentWindow().close()
}

function minimiseWindow(){
	remote.BrowserWindow.getFocusedWindow().minimize();
}

function maximiseWindow(){
	remote.BrowserWindow.getFocusedWindow().isMaximized() ? remote.BrowserWindow.getFocusedWindow().unmaximize() : remote.BrowserWindow.getFocusedWindow().maximize();

}

remote.getCurrentWindow().on('minimize', function() {
	console.log('closed')
  });
/*
  const { Menu, MenuItem } = remote
  
  const contextMenuWindow = new Menu()
  contextMenuWindow.append(new MenuItem({ label: 'MenuItem1', click() { console.log('item 1 clicked') } }))
  contextMenuWindow.append(new MenuItem({ type: 'separator' }))
  contextMenuWindow.append(new MenuItem({ label: 'MenuItem2', type: 'checkbox', checked: true }))
  
  window.addEventListener('contextmenu', (e) => {
	e.preventDefault()
	contextMenuWindow.popup({ window: remote.getCurrentWindow() })
  }, false)  */