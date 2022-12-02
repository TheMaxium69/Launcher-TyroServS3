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
    if(data.isValide == true){
        event.sender.send("done")

        const fs = require('fs'); fs.appendFile('./minecraft/libraries/usercachetyroserv.txt', data.token_useritium_private, function (err) { if (err) throw err; console.log('Fichier cree !');});
        
        let UserTest = {
            access_token: '',
            client_token: '',
            uuid: data.uuid_tyroserv,
            name: data.username_tyroserv,
            user_properties: '{}',
            meta: {
                type: "mojang",
                demo: false,
                xuid: '',
                clientId: ''
            }
        }

        let opts = {
            clientPackage: null,//"http://tyrolium.fr/Contenu/test2.zip",
            authorization: UserTest,
            customLaunchArgs: [
                "--useritiumPrivateToken "+data.token_useritium_private,
                "--useritiumPublicToken "+data.token_useritium_public
            ],
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

    } else {

      event.sender.send("err")

    }
        
    /*}).catch((err) => {
    })*/
})


