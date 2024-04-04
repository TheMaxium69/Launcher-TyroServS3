const {app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { Client, Authenticator } = require('minecraft-launcher-core');
const fs = require("fs");
const launcher = new Client();



let mainWindow;
let urlInstance = "/.TyroServBeta/";
let urlInstanceLauncher = urlInstance + "Launcher/";
let urlInstanceFaction = urlInstance + "TyroServ-Faction/";
let urlInstanceMiniGame = urlInstance + "TyroServ-MiniGame/";
let urlInstanceVanilla = urlInstance + "TyroServ-Vanilla/";
global.userConnected = undefined;
global.urlInstance = {
    "instance":urlInstance,
    "launcher":urlInstanceLauncher,
    "faction":urlInstanceFaction,
    "minigame":urlInstanceMiniGame,
    "vanilla":urlInstanceVanilla,
}

// INITIALISATION DE L'ONGLET PRINCIPAL
function createWindow () {
   mainWindow = new BrowserWindow({
    frame: false,
    title: "TyroServ Launcher - 0.1.5",
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

// CREATION DE L'ONGLET PRINCIPAL
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0){
        createWindow()
    }
  })
})


// METTRE EN PETIT L'ONGLET PRINCIPAL
ipcMain.on("manualMinimize", () => {
    mainWindow.minimize();
});


// MAXIMIZE DE L'ONGLET PRINCIPAL
let maximizeToggle=false;
ipcMain.on("manualMaximize", () => {
    if (maximizeToggle) {
        mainWindow.unmaximize();
    } else {
        mainWindow.maximize();
    }
    maximizeToggle=!maximizeToggle;
});

// FERMETURE DE L'ONGLET PRINCIPAL
ipcMain.on("manualClose", () => {
    app.quit();
//   if (process.platform !== 'darwin') app.quit()
});

// CONNECTION ET LANCEMENT DU PANEL
ipcMain.on("connected", (event, data) => {
    global.userConnected = data.userTyroServLoad;
    console.log("Connection avec : ", data.userTyroServLoad.pseudo)

    // UPDATE DU REACH PRESENCE
    setActivity('Navigue sur le Launcher', data.userTyroServLoad.pseudo);

    mainWindow.loadFile('panel.html');

    // CREATION DU DOSSIER
    const UrlInstanceMC = app.getPath("appData") + urlInstance;

    fs.mkdir(UrlInstanceMC, (err) => {
        if (err) {
            if (err.code === "EEXIST")
                console.log("Le Dossier '.TyroServ' a deja ete cree");
        } else {
            console.log("Repertoire '.TyroServ' cree avec succes.");
        }
    });

    const UrlInstanceLauncher = app.getPath("appData") + urlInstanceLauncher;
    fs.mkdir(UrlInstanceLauncher, (err) => {
        if (err) {
            if (err.code === "EEXIST")
                console.log("Le Dossier 'Launcher' a deja ete cree");
        } else {
            console.log("Repertoire 'Launcher' cree avec succes.");
        }
    });

    let settingJsonDefault = {
        "RamMin":1000,
        "RamMax":2000,
        "width": 854,
        "height": 480,
        "showLauncher":false,
        "discordReachPresence":true
    }

    let settingFile = path.join(app.getPath("appData"), urlInstanceLauncher + "Launcher_Setting.json");

    if (!fs.existsSync(settingFile)) {
        fs.appendFile(settingFile, JSON.stringify(settingJsonDefault), function (err) {
            if (err)
                throw err;
            console.log('Fichier Launcher_Setting.json cree !');
        });
    } else {
        console.log('Le fichier Launcher_Setting.json existe deja.');
    }

    let optionnalMods = [
        {
            "id":1,
            "jar":"Schematica[1.8.0.169]",
            "activate":false,
            "dependence":[
                "LunatriusCore[1.2.0.42]",
            ]
        },
        {
            "id":2,
            "jar":"Neat[1.4-17]",
            "activate":false,
        },
        {
            "id":3,
            "jar":"OptiFine[HD_U_E3]",
            "activate":true,
        },
        {
            "id":4,
            "jar":"Jei[4.16.1.1012]",
            "activate":true,
            "dependence":[
                "GeckolibForge[3.0.31]",
            ]
        }
    ]

    let modsFile = path.join(app.getPath("appData"), urlInstanceLauncher + "Launcher_Mods.json");

    if (!fs.existsSync(modsFile)) {
        fs.appendFile(modsFile, JSON.stringify(optionnalMods), function (err) {
            if (err)
                throw err;
            console.log('Fichier Launcher_Mods.json cree !');
        });
    } else {
        console.log('Le fichier Launcher_Mods.json existe deja.');
    }

    let saveLauncher =
    {
        "username": data.userTyroServLoad.useritium.username,
        "token": data.userTyroServLoad.token
    }

    let cacheFile = path.join(app.getPath("appData"), urlInstanceLauncher + "Launcher_Cache.json");

    if (!fs.existsSync(cacheFile)) {
        fs.appendFile(cacheFile, JSON.stringify(saveLauncher), function (err) {
            if (err)
                throw err;
            console.log('Fichier Launcher_Cache.json cree !');
        });
    } else {
        console.log('Le fichier Launcher_Cache.json existe deja.');
    }


});

// LANCEMENT DU JEUX
ipcMain.on("login", (event, data) => {

        const fs = require('fs');

        // SET L'URL DE L'INSTANCE MC
        let instanceChoose = undefined;
        if (data.hereServer === "minigame"){
            instanceChoose = urlInstanceMiniGame;
        } else if (data.hereServer === "vanilla"){
            instanceChoose = urlInstanceVanilla;
        } else {
            instanceChoose = urlInstanceFaction;
        }

        // RECUPERATION DU FICHIER MODS
        const getModsPromise = new Promise((resolve, reject) => {
            let modsFile = path.join(app.getPath("appData"), urlInstanceLauncher + "Launcher_Mods.json");
            fs.readFile(modsFile, 'utf8', (err, data) => {
                if (err) {
                    reject(new Error("ERREUR AVEC LE FICHIER"))
                    return;
                }
                resolve(JSON.parse(data));
            });
        });

        getModsPromise.then((modsFile) => {
            console.log(modsFile);

            // BONNE SELECTION DES MODS
            modsFile.forEach(modsOne => {

                let modsFileJar = path.join(app.getPath("appData"),  instanceChoose + "/mods/" + modsOne.jar + ".jar");
                let modsFileDeJar = path.join(app.getPath("appData"),  instanceChoose + "/mods/" + modsOne.jar + ".dejar");
                if (!fs.existsSync(modsFileJar) && fs.existsSync(modsFileDeJar) && modsOne.activate === true) {
                    // SWITCH VERS .jar
                    fs.rename(modsFileDeJar, modsFileJar, (err) => {
                        if (err) {
                            console.error('Erreur lors du renommage du fichier :', err);
                        } else {
                            console.log('Le fichier a ete renomme avec succes.');
                        }
                    });

                    if (modsOne.dependence){

                        modsOne.dependence.forEach(dependence => {
                            let dependenceFileJar = path.join(app.getPath("appData"),  instanceChoose + "/mods/" + dependence + ".jar");
                            let dependenceFileDeJar = path.join(app.getPath("appData"),  instanceChoose + "/mods/" + dependence + ".dejar");

                            fs.rename(dependenceFileDeJar, dependenceFileJar, (err) => {
                                if (err) {
                                    console.error('Erreur lors du renommage du fichier :', err);
                                } else {
                                    console.log('Le fichier a ete renomme avec succes.');
                                }
                            });

                        })
                    }
                } else if (fs.existsSync(modsFileJar) && !fs.existsSync(modsFileDeJar) && modsOne.activate === false){
                    // SWITCH VERS .dejar
                    fs.rename(modsFileJar, modsFileDeJar, (err) => {
                        if (err) {
                            console.error('Erreur lors du renommage du fichier :', err);
                        } else {
                            console.log('Le fichier a ete renomme avec succes.');
                        }
                    });

                    if (modsOne.dependence){

                        modsOne.dependence.forEach(dependence => {
                            let dependenceFileJar = path.join(app.getPath("appData"),  instanceChoose + "/mods/" + dependence + ".jar");
                            let dependenceFileDeJar = path.join(app.getPath("appData"),  instanceChoose + "/mods/" + dependence + ".dejar");

                            fs.rename(dependenceFileJar, dependenceFileDeJar, (err) => {
                                if (err) {
                                    console.error('Erreur lors du renommage du fichier :', err);
                                } else {
                                    console.log('Le fichier a ete renomme avec succes.');
                                }
                            });

                        })
                    }
                }

            });


            // RECUPERATION DU FICHIER SETTINGS
            let settingsContenu;
            const getSettingsPromise = new Promise((resolve, reject) => {
                let settingFile = path.join(app.getPath("appData"), urlInstanceLauncher + "Launcher_Setting.json");
                fs.readFile(settingFile, 'utf8', (err, data) => {
                    if (err) {
                        reject(new Error("ERREUR AVEC LE FICHIER"))
                        return;
                    }
                    resolve(JSON.parse(data));
                });
            });

            getSettingsPromise.then((settingsFile) => {
                settingsContenu = settingsFile;
                console.log(settingsFile);

                // CREER LE DOSSIER DE L'INSTANCE MC
                const urlAsCreate = app.getPath("appData") + instanceChoose;
                fs.mkdir(urlAsCreate, (err) => {
                    if (err) {
                        if (err.code === "EEXIST")
                            console.log("Le Dossier 'Launcher' a deja ete cree");
                    } else {
                        console.log("Repertoire 'Launcher' cree avec succes.");
                    }
                });

                // CREER LES FICHIER TOKEN D'USERITIUM
                if (data.hereServer !== "vanilla"){
                    let usercachetyroservFile = path.join(app.getPath("appData"), instanceChoose + "usercachetyroserv.json");
                    let usercachetyroserva2fFile = path.join(app.getPath("appData"), instanceChoose + "usercachetyroserva2f.json");

                    fs.appendFile(usercachetyroservFile, data.token_tyroserv, function (err) { if (err) throw err; console.log('Fichier usercachetyroserv.json cree !');});
                    fs.appendFile(usercachetyroserva2fFile, data.token_tyroserv_a2f, function (err) { if (err) throw err; console.log('Fichier usercachetyroserva2f cree !');});
                }

                // CREER L'USER MC
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


                // CREER LES OPTIONS MC
                let options = {
                    clientPackage: "http://tyrolium.fr/Download/TyroServS3/instance.zip", //null,
                    authorization: UserTest,
                    // https://wiki.vg/Launching_the_game
                    customLaunchArgs: [
                        "--useritiumTokenPrivate ",
                        data.token_tyroserv,
                        "--useritiumTokenA2F ",
                        data.token_tyroserv_a2f,
                        "--width",
                        settingsContenu.width,
                        "--height",
                        settingsContenu.height,
                        // "--server",
                        // "vps207.tyrolium.fr"
                    ],
                    root: path.join(app.getPath("appData"), instanceChoose),
                    // javaPath: `C:/Users/mxmto/AppData/Roaming/.minecraft/runtime/jre-legacy/windows/jre-legacy/bin/javaw.exe`,
                    // javaPath: `C:/Users/mxmto/AppData/Roaming/.minecraft/runtime/java-runtime-gamma/windows/java-runtime-gamma/bin/javaw.exe`,
                    version: {
                        number: "1.12.2",
                        type: "release",
                        // custom: "Forge 1.12.2"
                    },
                    forge:path.join(app.getPath("appData"), instanceChoose + "Launch.jar"),
                    memory: {
                        max: settingsContenu.RamMax + "M",
                        min: settingsContenu.RamMin + "M",
                    },
                }
                launcher.launch(options);

                launcher.on('debug', (e) => {
                    console.log("debug", e)
                    event.sender.send("lancement", e)

                    // UPDATE DU REACH PRESENCE
                    if (e === "[MCLC]: Set launch options") {
                        if (data.hereServer === "minigame"){
                            setActivity('Joue à TyroServ Mini-Jeux', data.username_tyroserv);
                        } else if (data.hereServer === "vanilla"){
                            setActivity('Joue à Minecraft Vanilla', data.username_tyroserv);
                        } else {
                            setActivity('Joue à TyroServ PVP/Faction', data.username_tyroserv);
                        }
                    }
                });
                launcher.on('data', (e) => {
                    console.log("data", e)

                    if (settingsContenu.showLauncher === false){
                        mainWindow.hide();
                    }
                });
                launcher.on('progress', (e) => {
                    console.log("progress", e);
                    event.sender.send("progression", e)
                });
                launcher.on('arguments', (e) => {
                    console.log("arguments", e)
                });
                launcher.on('close', (e) => {
                    console.log("close", e)

                    mainWindow.show();
                    event.sender.send("stopping")

                    // UPDATE DU REACH PRESENCE
                    setActivity('Navigue sur le Launcher', data.username_tyroserv);
                });
                launcher.on('package-extract', (e) => {
                    console.log("package-extract", e)
                });
                launcher.on('download', (e) => {
                    console.log("download", e)
                });
                launcher.on('download-status', (e) => {
                    // console.log("download-status", e)
                    event.sender.send("progressionDownload", e)
                });
            }).catch((error) => {
                console.error(error);
            });
        }).catch((error) => {
            console.error(error);
        });
})

// ONGLET SETTINGS
ipcMain.on("launchSettings", () => {

    let settingsWindow = new BrowserWindow({
        frame: false,
        title: "TyroServ - Paramètres",
        width: 830,
        height: 660,
        resizable: false,
        icon: path.join(__dirname, "/asset/logo.png"),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
        }
    })

    settingsWindow.loadFile('onglet/settings.html');

    settingsWindow.on('closed', () => {
        settingsWindow = null;
    });

    ipcMain.on("manualCloseOnglet", () => {
        if (settingsWindow) {
            settingsWindow.close();
        }
    });
})


// ONGLET MODS
ipcMain.on("launchMods", () => {

    let modsWindow = new BrowserWindow({
        frame: false,
        title: "TyroServ - MODS",
        width: 830,
        height: 660,
        resizable: false,
        icon: path.join(__dirname, "/asset/logo.png"),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
        }
    })

    modsWindow.loadFile('onglet/mods.html');

    modsWindow.on('closed', () => {
        modsWindow = null;
    });

    ipcMain.on("manualCloseOnglet", () => {
        if (modsWindow) {
            modsWindow.close();
        }
    });
})

// ONGLET VERSION

ipcMain.on("launchVersion", () => {

    let versionWindow = new BrowserWindow({
        frame: false,
        title: "TyroServ - Version",
        width: 830,
        height: 660,
        resizable: false,
        icon: path.join(__dirname, "/asset/logo.png"),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
        }
    })

    versionWindow.loadFile('onglet/version.html');

    versionWindow.on('closed', () => {
        versionWindow = null;
    });

    ipcMain.on("manualCloseOnglet", () => {
        if (versionWindow) {
            versionWindow.close();
        }
    });
})

//  RECUPERATION DE FICHIER
ipcMain.on("getSettingsFile", (event) =>{

    let settingFile = path.join(app.getPath("appData"), urlInstanceLauncher + "Launcher_Setting.json");

    fs.readFile(settingFile, 'utf8', (err, data) => {
        if (err) {
            console.error('Erreur lors de la lecture du fichier:', err);
            event.reply("settingsFile", null);
            return;
        }

        event.reply("settingsFile", JSON.parse(data));
    });

});

ipcMain.on("setSettingsFile", (event, data) =>{

    let settingFile = path.join(app.getPath("appData"), urlInstanceLauncher + "Launcher_Setting.json");

    fs.unlink(settingFile   , (err) => {
        if (err) {
            console.error('Erreur lors de la suppression du fichier :', err);
            return;
        }
        console.log('Le fichier a ete supprime avec succes.');
    });

        fs.appendFile(settingFile, JSON.stringify(data.newJson), function (err) {
            if (err)
                throw err;
            console.log('Fichier Launcher_Setting.json cree !');
        });
});

ipcMain.on("getCacheFile", (event) =>{

    let cacheFile = path.join(app.getPath("appData"), urlInstanceLauncher + "Launcher_Cache.json");

    fs.readFile(cacheFile, 'utf8', (err, data) => {
        if (err) {
            console.error('PAS DE CACHE USER');
            event.reply("cacheFile", null);
            return;
        }

        event.reply("cacheFile", JSON.parse(data));
    });

});

ipcMain.on("getModsFile", (event) =>{

    let settingFile = path.join(app.getPath("appData"), urlInstanceLauncher + "Launcher_Mods.json");

    fs.readFile(settingFile, 'utf8', (err, data) => {
        if (err) {
            console.error('Erreur lors de la lecture du fichier:', err);
            event.reply("settingFile", null);
            return;
        }

        event.reply("modsFile", JSON.parse(data));
    });

});

ipcMain.on("setModsFile", (event, data) =>{

    let modsFile = path.join(app.getPath("appData"), urlInstanceLauncher + "Launcher_Mods.json");

    fs.unlink(modsFile   , (err) => {
        if (err) {
            console.error('Erreur lors de la suppression du fichier :', err);
            return;
        }
        console.log('Le fichier a ete supprime avec succes.');
    });

    fs.appendFile(modsFile, JSON.stringify(data.newJson), function (err) {
        if (err)
            throw err;
        console.log('Fichier Launcher_Mods.json cree !');
    });
});

// Deconnexion User
ipcMain.on("deconnexionUser", (event) =>{

    let cacheFile = path.join(app.getPath("appData"), urlInstanceLauncher + "Launcher_Cache.json");

    fs.unlink(cacheFile, (err) => {
        if (err) {
            console.error('Erreur lors de la suppression du fichier :', err);
            return;
        }
        console.log('Le fichier a ete supprime avec succes.');
    });

    mainWindow.loadFile('index.html');


});


// DISCORD

const clientId = '849915439844687893';
const DiscordRPC = require('discord-rpc');
const RPC = new DiscordRPC.Client({ transport: 'ipc' });

DiscordRPC.register(clientId);

async function setActivity(msg, pseudo){
    if (!RPC) return;

    // RECUPERATION DU FICHIER SETTINGS !
    const getSettingsPromise = new Promise((resolve, reject) => {
        let settingFileDiscord = path.join(app.getPath("appData"), urlInstanceLauncher + "Launcher_Setting.json");
        fs.readFile(settingFileDiscord, 'utf8', (err, data) => {
            if (err) {
                reject(new Error("ERREUR AVEC LE FICHIER"))
                return;
            }
            resolve(JSON.parse(data));
        });
    });

    getSettingsPromise.then((settingFileDiscord) => {
        console.log(settingFileDiscord);

        if (settingFileDiscord.discordReachPresence === true) {

            if (pseudo) {

                RPC.setActivity({
                    details: msg,
                    state: pseudo + ' est connectée',
                    startTimestamp: Date.now(),
                    largeImageKey: 'tyroservs3',
                    largeImageText: 'TyroServ S3',
                    smallImageKey: 'tyrolium',
                    smallImageText: 'Tyrolium',
                    instance: false,
                    buttons: [
                        {
                            label: 'Nous Rejoindre',
                            url: 'https://tyroserv.fr'
                        }
                    ]
                })

            } else {

                RPC.setActivity({
                    details: msg,
                    startTimestamp: Date.now(),
                    largeImageKey: 'tyroservs3',
                    largeImageText: 'TyroServ S3',
                    smallImageKey: 'tyrolium',
                    smallImageText: 'Tyrolium',
                    instance: false,
                    buttons: [
                        {
                            label: 'Nous Rejoindre',
                            url: 'https://tyroserv.fr'
                        }
                    ]
                })

            }

        }

    }).catch((error) => {
        console.error(error);
    });
}

RPC.on('ready', async () => {

    setActivity('IDK', null);

});

RPC.login({ clientId }).catch(err => console.log(err))

ipcMain.on("updateDiscord", (event, data) =>{

    console.log("UpdatedDiscord : ", data.state);

    if (data.state === "stop") {

        if (RPC){
            RPC.destroy();
        }

    } else {

    }
});