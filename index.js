const {app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { Client, Authenticator } = require('minecraft-launcher-core');
const launcher = new Client();


function createWindow () {
  const mainWindow = new BrowserWindow({
    frame: false,  
    title: "Tyrolium Launcher",
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      preload: path.join(__dirname, 'preload.js'),
    }
  })

  mainWindow.loadFile('index.html')
}

app.whenReady().then(() => {
  createWindow()
  
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.on("login", (event, data) => {
    // Authenticator.getAuth(data.u, data.p).then(() => {
        event.sender.send("done")
        let UserTest = {
            access_token: '',
            client_token: '',
            uuid: '',
            name: 'TheMaximeSan',
            user_properties: '{}',
            meta: {
                type: 'mojang' || 'msa',
                demo: true || false, // Demo can also be specified by adding 'is_demo_user' to the options.feature array 
                // properties only exists for specific Minecraft versions.
                xuid: '',
                clientId: ''
            }
        }


        let opts = {
            clientPackage: null,//"http://tyrolium.fr/Contenu/test2.zip",
            authorization: UserTest,
            root: `./minecraft`,
            version: {
                number: "1.12.2",
                type: "release"
            },
            forge: `./minecraft/versions/1.12.2-forge-14.23.5.2854/1.12.2-forge-14.23.5.2854.jar`,
            forge: `./minecraft/forge.jar`,
            memory: {
                max: "2G",
                min: "1G"
            },
        }
        launcher.launch(opts);
         
        launcher.on('debug', (e) => console.log(e));
        launcher.on('data', (e) => console.log(e));
        launcher.on('progress', (e) => {
            console.log(e);
            event.sender.send("progression", e)
        })
    /*}).catch((err) => {
        event.sender.send("err", { er: err })
    })*/
})