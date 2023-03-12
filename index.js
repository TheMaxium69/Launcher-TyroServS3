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
    icon: path.join(__dirname, "/asset/logo.png"),
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      // preload: path.join(__dirname, 'preload.js'),
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
        // event.sender.send("done")

        let usercachetyroservFile = path.join(app.getPath("appData"), "/.TyroServBeta/usercachetyroserv.json");
        let usercachetyroserva2fFile = path.join(app.getPath("appData"), "/.TyroServBeta/usercachetyroserva2f.json");

        const fs = require('fs'); 
        fs.appendFile(usercachetyroservFile, data.token_tyroserv, function (err) { if (err) throw err; console.log('Fichier cree !');});
        fs.appendFile(usercachetyroserva2fFile, data.token_tyroserv_a2f, function (err) { if (err) throw err; console.log('Fichier cree !');});
        
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
            clientPackage: "http://tyrolium.fr/Download/TyroServS3/instance.zip", //null,
            authorization: UserTest,
            customLaunchArgs: [
                "--useritiumTokenPrivate "+data.token_tyroserv,
                "--useritiumTokenA2F "+data.token_tyroserv_a2f
            ],
            root: path.join(app.getPath("appData"), "/.TyroServBeta/"),
            // javaPath: `C:/Users/mxmto/AppData/Roaming/.minecraft/runtime/jre-legacy/windows/jre-legacy/bin/javaw.exe`,
            version: {
                number: "1.16.5",
                type: "release",
                // custom: "1.16.5-forge-36.2.34"
            },
            forge:path.join(app.getPath("appData"), "/.TyroServBeta/forge-1.16.5-36.2.34-installer.jar"),
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
})