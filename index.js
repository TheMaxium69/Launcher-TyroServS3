const {app, BrowserWindow, ipcMain, dialog} = require('electron')
const path = require('path')
const { Client, Authenticator } = require('minecraft-launcher-core');
const request = require('request');
const fs = require("fs");
const global = require('./global.js');

let launcher = null;
let mainWindow;
let userConnected = undefined;

// LANCEMENT DU LAUNCHER
app.whenReady().then(() => {
    console.log("ENV : ", process.env.NODE_ENV);

    createWindow(); /* Création de l'onglet principal */

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0){
            createWindow()
        }
    })
})

/*
*
* GESTION FENETRE PRINCIPAL
*
* */

// INITIALISATION DE L'ONGLET PRINCIPAL
function createWindow () {
   mainWindow = new BrowserWindow({
    frame: false,
    title: global.TITLE_FIRST_WINDOW,
    width: global.FIRST_WINDOW_WIDHT,
    height: global.FIRST_WINDOW_HEIGHT,
    resizable: global.FIRST_WINDOW_RESIZABLE,
    icon: path.join(__dirname, "/asset/logo.png"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      preload: path.join(__dirname, 'preload.js'),
    }
  })

  mainWindow.loadFile('index.html')
  mainWindow.setMenuBarVisibility(false);

}

// METTRE EN PETIT L'ONGLET PRINCIPAL
ipcMain.on("manualMinimize", () => {
    mainWindow.minimize();
});

// MAXIMIZE DE L'ONGLET PRINCIPAL
let maximizeToggle= false;
ipcMain.on("manualMaximize", () => {
    if (global.FIRST_WINDOW_RESIZABLE){
        if (maximizeToggle) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
        maximizeToggle=!maximizeToggle;
    }
});

// FERMETURE DE L'ONGLET PRINCIPAL
ipcMain.on("manualClose", () => {
    app.quit();
//   if (process.platform !== 'darwin') app.quit()
});


/*
*
* GESTION UTILISATEUR
*
* */


// RECUPERATION DE L'UTILISATEUR
ipcMain.on('getUserConnected', (event) => {
    event.sender.send('userConnected', userConnected);
});

// Deconnexion User
ipcMain.on("deconnexionUser", (event) =>{

    setActivity('IDK', null);
    let cacheFile = path.join(app.getPath("appData"), global.DIR_INSTANCE_LAUNCHER + "Launcher_Cache.json");

    fs.unlink(cacheFile, (err) => {
        if (err) {
            console.error('Erreur lors de la suppression du fichier :', err);
            return;
        }
        console.log('Le fichier a ete supprime avec succes.');
    });

    mainWindow.loadFile('index.html');


});

// CONNECTION ET LANCEMENT DU PANEL
ipcMain.on("connected", async (event, data) => {

    // SET LA VARIABLE UTILISATEUR
    userConnected = data.userTyroServLoad;
    console.log("Connection avec : ", data.userTyroServLoad.pseudo)

    // CHARGER LE FICHIER PANEL
    mainWindow.loadFile('panel.html');

    // UPDATE DU REACH PRESENCE
    setActivity('Navigue sur le Launcher', data.userTyroServLoad.pseudo);

    // CREATION DU DOSSIER
    const UrlInstanceMC = app.getPath("appData") + global.DIR_INSTANCE;

    fs.mkdir(UrlInstanceMC, (err) => {
        if (err) {
            if (err.code === "EEXIST")
                console.log("Le Dossier '.TyroServ' a deja ete cree");
        } else {
            console.log("Repertoire '.TyroServ' cree avec succes.");
        }
    });

    /* GESTION DU FICHIER SETTINGS */
    fs.mkdir(app.getPath("appData") + global.DIR_INSTANCE_LAUNCHER, (err) => {
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

    let settingFile = path.join(app.getPath("appData"), global.DIR_INSTANCE_LAUNCHER + "Launcher_Setting.json");

    if (!fs.existsSync(settingFile)) {
        fs.appendFile(settingFile, JSON.stringify(settingJsonDefault), function (err) {
            if (err)
                throw err;
            console.log('Fichier Launcher_Setting.json cree !');
        });
    } else {
        console.log('Le fichier Launcher_Setting.json existe deja.');
    }

    /* GESTION DU FICHIER CACHE */

    let saveLauncher =
    {
        "username": data.userTyroServLoad.useritium.username,
        "token": data.userTyroServLoad.token
    }

    let cacheFile = path.join(app.getPath("appData"), global.DIR_INSTANCE_LAUNCHER + "Launcher_Cache.json");

    if (!fs.existsSync(cacheFile)) {
        fs.appendFile(cacheFile, JSON.stringify(saveLauncher), function (err) {
            if (err)
                throw err;
            console.log('Fichier Launcher_Cache.json cree !');
        });
    } else {
        console.log('Le fichier Launcher_Cache.json existe deja.');
    }


    /* GESTION DU FICHIER MODS */

    await (async () => {
        let modsFile = path.join(app.getPath("appData"), global.DIR_INSTANCE_LAUNCHER + "Launcher_Mods.json");

        // Vérifie d'abord si le fichier existe
        if (fs.existsSync(modsFile)) {
            console.log('Le fichier Launcher_Mods.json existe deja.');
            return; // Pas besoin de continuer
        }

        // Sinon, on télécharge les mods
        // console.log('Fichier Launcher_Mods.json manquant, récupération en cours...');
        try {
            let optionnalMods = await fetchOptionnalMods();

            fs.writeFileSync(modsFile, JSON.stringify(optionnalMods, null, 2));
            console.log('Fichier Launcher_Mods.json cree !');
        } catch (err) {
            console.error("Erreur lors de la creation des Launcher_Mods.json :", err);
        }
    })();


});


/*
*
* GESTION DU JEU
*
* */

// LANCEMENT DU JEUX
ipcMain.on("login", (event, data) => {

        const fs = require('fs');

        // SET L'URL DE L'INSTANCE MC
        let instanceChoose = undefined;
        if (data.hereServer === "minigame"){
            instanceChoose = global.DIR_INSTANCE_MINIGAME;
        } else if (data.hereServer === "vanilla"){
            instanceChoose = global.DIR_INSTANCE_VANILLA;
        } else {
            instanceChoose = global.DIR_INSTANCE_FACTION;
        }

        // RECUPERATION DU FICHIER MODS
        const getModsPromise = new Promise((resolve, reject) => {
            let modsFile = path.join(app.getPath("appData"), global.DIR_INSTANCE_LAUNCHER + "Launcher_Mods.json");
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

            // Vider le dossier mods avant de démarré
            const clearModsFolder = new Promise((resolve, reject) => {
                const modsFolderPath = path.join(app.getPath("appData"), instanceChoose + "/mods");
                if (fs.existsSync(modsFolderPath)) {
                    const files = fs.readdirSync(modsFolderPath);
                    for (const file of files) {
                        const curPath = path.join(modsFolderPath, file);
                        try {
                            fs.unlinkSync(curPath);
                        } catch (err) {
                            reject(new Error("Instance deja en cours d'execution. Impossible de vider les mods."));
                            return; // ← arrête ici et empêche le resolve
                        }
                    }
                    console.log("Dossier mods vide.");
                    resolve();
                } else {
                    fs.mkdirSync(modsFolderPath, { recursive: true });
                    console.log("Dossier mods cree.");
                    resolve();
                }
            });

            clearModsFolder.then(() => {

                // RECUPERATION DU FICHIER SETTINGS
                let settingsContenu;
                const getSettingsPromise = new Promise((resolve, reject) => {
                    let settingFile = path.join(app.getPath("appData"), global.DIR_INSTANCE_LAUNCHER + "Launcher_Setting.json");
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
                    if (data.hereServer !== "vanilla") {
                        let usercachetyroservFile = path.join(app.getPath("appData"), instanceChoose + "usercachetyroserv.json");
                        let usercachetyroserva2fFile = path.join(app.getPath("appData"), instanceChoose + "usercachetyroserva2f.json");

                        fs.writeFileSync(usercachetyroservFile, data.token_tyroserv);
                        fs.writeFileSync(usercachetyroserva2fFile, data.token_tyroserv_a2f);
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

                    launcher = new Client();

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

                        //vider l'instance de minecraft
                        launcher = null;

                        mainWindow.show();
                        event.sender.send("stopping")

                        // UPDATE DU REACH PRESENCE
                        setActivity('Navigue sur le Launcher', data.username_tyroserv);
                    });
                    launcher.on('package-extract', (e) => {
                        console.log("package-extract", e)

                        if (e.toString() === "true"){

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
                                            let dependenceFileJar = path.join(app.getPath("appData"),  instanceChoose + "/mods/" + dependence.jar + ".jar");
                                            let dependenceFileDeJar = path.join(app.getPath("appData"),  instanceChoose + "/mods/" + dependence.jar + ".dejar");

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
                        }

                    });
                    launcher.on('download', (e) => {
                        console.log("download", e)
                    });
                    launcher.on('download-status', (e) => {
                        console.log("download-status", e)
                        event.sender.send("progressionDownload", e)
                    });

                    // Launch -> Del All Mod -> Install Instance -> DeJar & Jar (activate) -> Launch Game


                }).catch((error) => {
                    console.error(error);
                });


            }).catch((error) => {
                console.error(error);
            });

        }).catch((error) => {
            console.error(error);
        });
})


/*
*
* ONGLET SECONDAIRE
*
* */


// ONGLET SETTINGS
ipcMain.on("launchSettings", () => {

    let settingsWindow = new BrowserWindow({
        frame: false,
        title: global.TITLE_ONGLET + "Paramètres",
        width: global.ONGLET_WIDHT,
        height: global.ONGLET_HEIGHT,
        resizable: global.ONGLET_RESIZABLE,
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
        title: global.TITLE_ONGLET + "MODS",
        width: global.ONGLET_WIDHT,
        height: global.ONGLET_HEIGHT,
        resizable: global.ONGLET_RESIZABLE,
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
        title: global.TITLE_ONGLET + "Version",
        width: global.ONGLET_WIDHT,
        height: global.ONGLET_HEIGHT,
        resizable: global.ONGLET_RESIZABLE,
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


/*
*
* FICHIER CONFIGURATION
*
* */


//  RECUPERATION SETTINGS
ipcMain.on("getSettingsFile", (event) =>{

    let settingFile = path.join(app.getPath("appData"), global.DIR_INSTANCE_LAUNCHER + "Launcher_Setting.json");

    fs.readFile(settingFile, 'utf8', (err, data) => {
        if (err) {
            console.error('Erreur lors de la lecture du fichier:', err);
            event.reply("settingsFile", null);
            return;
        }

        event.reply("settingsFile", JSON.parse(data));
    });

});

//  SET SETTINGS
ipcMain.on("setSettingsFile", async (event, data) => {
    let settingFile = path.join(app.getPath("appData"), global.DIR_INSTANCE_LAUNCHER + "Launcher_Setting.json");

    try {
        // Suppression de l'ancien fichier
        await fs.promises.unlink(settingFile);
        console.log('Le fichier a ete supprime avec succes.');

        // Écriture du nouveau fichier
        await fs.promises.writeFile(settingFile, JSON.stringify(data.newJson, null, 2));
        console.log('Fichier Launcher_Setting.json cree !');

        // Optionnel : Envoyer une confirmation au renderer
        event.reply('settingsFileUpdated', {success: true});

    } catch (err) {
        console.error('Erreur lors de la mise a jour du fichier :', err);

        // Gestion spécifique si le fichier n'existe pas
        if (err.code === 'ENOENT') {
            try {
                await fs.promises.writeFile(settingFile, JSON.stringify(data.newJson, null, 2));
                console.log('Nouveau fichier Launcher_Setting.json cree !');
                event.reply('settingsFileUpdated', {success: true});
                return;
            } catch (writeErr) {
                console.error('Erreur lors de la creation du fichier :', writeErr);
            }
        }

        // Informer le renderer de l'échec
        event.reply('settingsFileUpdated', {
            success: false,
            error: err.message
        });
    }
});

//  RECUPERATION CACHE
ipcMain.on("getCacheFile", (event) =>{

    let cacheFile = path.join(app.getPath("appData"), global.DIR_INSTANCE_LAUNCHER + "Launcher_Cache.json");

    fs.readFile(cacheFile, 'utf8', (err, data) => {
        if (err) {
            console.error('PAS DE CACHE USER');
            event.reply("cacheFile", null);
            return;
        }

        event.reply("cacheFile", JSON.parse(data));
    });

});

//  RECUPERATION MODS
ipcMain.on("getModsFile", (event) =>{

    let settingFile = path.join(app.getPath("appData"), global.DIR_INSTANCE_LAUNCHER + "Launcher_Mods.json");

    fs.readFile(settingFile, 'utf8', (err, data) => {
        if (err) {
            console.error('Erreur lors de la lecture du fichier:', err);
            event.reply("settingFile", null);
            return;
        }

        event.reply("modsFile", JSON.parse(data));
    });

});

//  SET MODS
ipcMain.on("setModsFile", (event, data) =>{

    let modsFile = path.join(app.getPath("appData"), global.DIR_INSTANCE_LAUNCHER + "Launcher_Mods.json");

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


/*
*
* CONFIG MODS
*
* */


ipcMain.on("getInfoLauncher", (event) => {

    let infoLauncher = [];

    request('https://tyrolium.fr/Download/TyroServS3/launcher/index.php?t=launcher', { json: true }, (err, res, body) => {
        if (err) {
            console.error('Erreur lors de la récupération des info launcher:', err);
            event.sender.send("setInfoLauncher", []); // Envoyer un tableau vide en cas d'erreur
            return;
        }
        if (res.statusCode !== 200) {
            console.error('Erreur HTTP lors de la récupération des info launcher:', res.statusCode);
            event.sender.send("setInfoLauncher", []);
            return;
        }
        infoLauncher = body;
        event.sender.send("setInfoLauncher", infoLauncher);
    });


})

ipcMain.on("getModsLock", (event) => {

    // console.log("getModsLock COUCOU")
    let lockMods = [];

    request('https://tyrolium.fr/Download/TyroServS3/launcher/index.php?t=lock', { json: true }, (err, res, body) => {
        if (err) {
            console.error('Erreur lors de la récupération des mods lock:', err);
            event.sender.send("setModsLock", []); // Envoyer un tableau vide en cas d'erreur
            return;
        }
        if (res.statusCode !== 200) {
            console.error('Erreur HTTP lors de la récupération des mods lock:', res.statusCode);
            event.sender.send("setModsLock", []);
            return;
        }
        lockMods = body;
        event.sender.send("setModsLock", lockMods);
    });


})

ipcMain.on("getModsOptionnal", async (event) => {
    try {
        const mods = await fetchOptionnalMods();
        event.sender.send("setModsOptionnal", mods);
    } catch (err) {
        console.error("Erreur lors de la récupération des mods optionnal:", err);
        event.sender.send("setModsOptionnal", []);
    }
});

function fetchOptionnalMods() {
    return new Promise((resolve, reject) => {
        request('https://tyrolium.fr/Download/TyroServS3/launcher/index.php?t=optional', { json: true }, (err, res, body) => {
            if (err) return reject(err);
            if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
            resolve(body);
        });
    });
}

/*
*
* DISCORD
*
* */

const clientId = global.DISCORD_CLIENT_ID;
const DiscordRPC = require('discord-rpc');
const RPC = new DiscordRPC.Client({ transport: 'ipc' });

DiscordRPC.register(clientId);

async function setActivity(msg, pseudo){
    if (!RPC) return;

    // RECUPERATION DU FICHIER SETTINGS !
    const getSettingsPromise = new Promise((resolve, reject) => {
        let settingFileDiscord = path.join(app.getPath("appData"), global.DIR_INSTANCE_LAUNCHER + "Launcher_Setting.json");
        fs.readFile(settingFileDiscord, 'utf8', (err, data) => {
            if (err) {
                reject(new Error("ERREUR AVEC LE FICHIER"))
                return;
            }
            resolve(JSON.parse(data));
        });
    });

    getSettingsPromise.then((settingFileDiscord) => {
        // console.log(settingFileDiscord);

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
                            url: global.URL_TYROSERV_SITEWEB
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
                            url: global.URL_TYROSERV_SITEWEB
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

        dialog.showErrorBox("Restart Launcher", "il faut redémarré le launcher");

    }
});