const {app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { Client, Authenticator } = require('minecraft-launcher-core');
const launcher = new Client();

global.userConnected = undefined;
let mainWindow;
function createWindow () {
   mainWindow = new BrowserWindow({
    frame: false,
    title: "TyroServ Launcher - 0.1.2",
    // width: 830,
    // height: 660,
    width: 1318,
    height: 710,
    resizable: false,
    icon: path.join(__dirname, "/asset/logo.png"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      // preload: path.join(__dirname, 'preload.js'),
    }
  })

  mainWindow.loadFile('index.html')
  mainWindow.setMenuBarVisibility(false);

}

app.whenReady().then(() => {
  createWindow()
  
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0){
        createWindow()
    }
  })
})

let maximizeToggle=false;
ipcMain.on("manualMinimize", () => {
    mainWindow.minimize();
});
ipcMain.on("manualMaximize", () => {
    if (maximizeToggle) {
        mainWindow.unmaximize();
    } else {
        mainWindow.maximize();
    }
    maximizeToggle=!maximizeToggle;
});
ipcMain.on("manualClose", () => {
    app.quit();
//   if (process.platform !== 'darwin') app.quit()
});

ipcMain.on("connected", (event, data) => {
    global.userConnected = data.userTyroServLoad;
    console.log("Connection avec : ", data.userTyroServLoad.pseudo)

    mainWindow.loadFile('panel.html')

    mainWindow.webContents.on('dom-ready', () => {
        mainWindow.webContents.executeJavaScript(`
            let welcomeP = document.getElementById("welcome");
            if (welcomeP) {
                welcomeP.innerText = "Bienvenue : " + "${data.userTyroServLoad.pseudo}";
            }
        `);
    });
});


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
                // type: "msa",
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
            // javaPath: `C:/Users/mxmto/AppData/Roaming/.minecraft/runtime/java-runtime-gamma/windows/java-runtime-gamma/bin/javaw.exe`,
            version: {
                number: "1.12.2",
                type: "release",
                // custom: "Forge 1.12.2"
            },
            windows: {
                width: "1318",
                height: "710"
            },
            forge:path.join(app.getPath("appData"), "/.TyroServBeta/forge-1.12.2-14.23.5.2860-installer.jar"),
            memory: {
                max: "4G",
                min: "2G"
            },
        }
        launcher.launch(opts);

        launcher.on('debug', (e) => console.log("debug", e));
        launcher.on('data', (e) => {
            console.log("data", e)

            mainWindow.hide();
            if (e.includes('Stopping!')) {
                console.log("Minecraft Stop");

                setTimeout(() => {
                    mainWindow.show();
                    event.sender.send("stopping")
                }, 1000);
            }
        });
        launcher.on('progress', (e) => {
            console.log("progress", e);
            event.sender.send("progression", e)
        })
})