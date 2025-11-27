const {app, BrowserWindow, ipcMain, dialog} = require('electron')
const path = require('path')
const { Client, Authenticator } = require('minecraft-launcher-core');
const request = require('request');
const fs = require("fs");
const global = require('./module/global.js');
const logger = require('./module/logger.js');

let launcher = null;
let mainWindow;
let userConnected = undefined;

// LANCEMENT DU LAUNCHER
app.whenReady().then(() => {
    logger.info("-----------------------------------------------------------------------------");
    logger.info("Lancement de " + global.NAME_LAUNCHER + " v" + global.VERSION_LAUNCHER);
    logger.info("Environement : "+ global.ENV_SYS +":"+ process.env.NODE_ENV);

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
      preload: path.join(__dirname, 'module/preload.js'),
    }
  })

  mainWindow.loadFile('onglet/index.html')
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
    logger.info("Fermeture du Launcher");
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

    logger.info("Deconnexion de l'utilisateur")

    setActivity('IDK', null);
    let cacheFile = path.join(app.getPath("appData"), global.DIR_INSTANCE_LAUNCHER + global.FILE_CACHE);

    fs.unlink(cacheFile, (err) => {
        if (err) {
            crashFatal('Erreur lors de la suppression du fichier '+global.FILE_CACHE, err, true);
        }
        logger.warn('Le fichier '+global.FILE_CACHE+' a ete supprime avec succes.');
    });

    mainWindow.loadFile('onglet/index.html');


});

// CONNECTION ET LANCEMENT DU PANEL
ipcMain.on("connected", async (event, data) => {

    // SET LA VARIABLE UTILISATEUR
    userConnected = data.userTyroServLoad;
    logger.info("Connection avec "+ data.userTyroServLoad.pseudo);

    // CHARGER LE FICHIER PANEL
    mainWindow.loadFile('onglet/panel.html');

    // UPDATE DU REACH PRESENCE
    setActivity('Navigue sur le Launcher', data.userTyroServLoad.pseudo);

    // CREATION DU DOSSIER
    const UrlInstanceMC = app.getPath("appData") + global.DIR_INSTANCE;

    fs.mkdir(UrlInstanceMC, (err) => {
        if (err) {
            if (err.code === "EEXIST"){
                logger.warn("Le Dossier '"+ global.DIR_INSTANCE +"' a deja ete cree");
            } else {
                crashFatal("Erreur de creation de '"+ global.DIR_INSTANCE +"'", err, true);
            }
        } else {
            logger.warn("Repertoire '"+ global.DIR_INSTANCE +"' cree avec succes.");
        }
    });

    /* GESTION DU FICHIER SETTINGS */
    fs.mkdir(app.getPath("appData") + global.DIR_INSTANCE_LAUNCHER, (err) => {
        if (err) {
            if (err.code === "EEXIST"){
                logger.warn("Le Dossier 'Launcher/' a deja ete cree");
            } else {
                crashFatal( "Erreur de creation de 'Launcher/'", err, true)
            }
        } else {
            logger.warn("Repertoire 'Launcher/' cree avec succes.");
        }
    });

    let settingJsonDefault = {
        "RamMin":4000,
        "RamMax":8000,
        "width": 1318,
        "height": 710,
        "showLauncher":false,
        "discordReachPresence":true,
        "console":false,
    }

    let settingFile = path.join(app.getPath("appData"), global.DIR_INSTANCE_LAUNCHER + global.FILE_SETTINGS);

    if (!fs.existsSync(settingFile)) {
        fs.appendFile(settingFile, JSON.stringify(settingJsonDefault), function (err) {
            if (err) {
                crashFatal("Erreur de creation de '"+ global.FILE_SETTINGS +"'", err , true);
            } else {
                logger.warn("Fichier '"+ global.FILE_SETTINGS +"' cree avec succes.");
            }
        });
    } else {
        logger.warn("Le fichier '"+ global.FILE_SETTINGS +"' existe deja.");
    }

    /* GESTION DU FICHIER CACHE */

    let saveLauncher =
    {
        "username": data.userTyroServLoad.useritium.username,
        "token": data.userTyroServLoad.token
    }

    let cacheFile = path.join(app.getPath("appData"), global.DIR_INSTANCE_LAUNCHER + global.FILE_CACHE);

    if (!fs.existsSync(cacheFile)) {
        fs.appendFile(cacheFile, JSON.stringify(saveLauncher), function (err) {
            if (err) {
                crashFatal("Erreur de creation de '"+ global.FILE_CACHE +"'", err , true);
            } else {
                logger.warn("Fichier '"+ global.FILE_CACHE +"' cree avec succes.");
            }
        });
    } else {
        logger.warn("Le fichier '"+ global.FILE_CACHE +"' existe deja.");
    }


    /* GESTION DU FICHIER MODS */

    await (async () => {
        let modsFile = path.join(app.getPath("appData"), global.DIR_INSTANCE_LAUNCHER + global.FILE_MODS);

        // Vérifie d'abord si le fichier existe
        if (fs.existsSync(modsFile)) {
            logger.warn("Le fichier '"+ global.FILE_MODS +"' existe deja.");
            return; // Pas besoin de continuer
        }

        // Sinon, on télécharge les mods
        // console.log('Fichier Launcher_Mods.json manquant, récupération en cours...');
        try {
            let optionnalMods = await fetchOptionnalMods();

            fs.writeFileSync(modsFile, JSON.stringify(optionnalMods, null, 2));
            logger.warn("Fichier '"+ global.FILE_MODS +"' cree avec succes.");
        } catch (err) {
            crashFatal("Erreur de creation de '"+ global.FILE_MODS +"'", err , true);
        }
    })();


});


/*
*
* GESTION DU JEU
*
* */

// PRE-LANCEMENT DU JEUX
ipcMain.on("login", (event, data) => {
        logger.info("Preparation au lancement du jeu ...");

        if (modsWindow){
            modsWindow.close();
        }

        if (versionWindow){
            versionWindow.close();
        }

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

        logger.info("Instance choisi : " + data.hereServer.toUpperCase());

        // RECUPERATION DU FICHIER MODS
        const getModsPromise = new Promise((resolve, reject) => {
            let modsFile = path.join(app.getPath("appData"), global.DIR_INSTANCE_LAUNCHER + global.FILE_MODS);
            fs.readFile(modsFile, 'utf8', (err, data) => {
                if (err) {
                    reject(err)
                    return;
                }
                resolve(JSON.parse(data));
            });
        });

        getModsPromise.then((modsFile) => {
            logger.debug("Contenu du fichier "+global.FILE_MODS+" : "+JSON.stringify(modsFile));

            // Vider le dossier mods avant de démarré
            const clearModsFolder = new Promise((resolve, reject) => {
                const modsFolderPath = path.join(app.getPath("appData"), instanceChoose + global.DIR_INSTANCE_MOD);
                if (fs.existsSync(modsFolderPath)) {
                    const files = fs.readdirSync(modsFolderPath);
                    for (const file of files) {
                        const curPath = path.join(modsFolderPath, file);
                        try {
                            fs.unlinkSync(curPath);
                        } catch (err) {
                            reject(err);
                            return;
                        }
                    }
                    logger.warn("Dossier mods vide.");
                    resolve();
                } else {
                    fs.mkdirSync(modsFolderPath, { recursive: true });
                    logger.warn("Dossier mods cree.");
                    resolve();
                }
            });

            clearModsFolder.then(() => {

                // RECUPERATION DU FICHIER SETTINGS
                let settingsContenu;
                const getSettingsPromise = new Promise((resolve, reject) => {
                    let settingFile = path.join(app.getPath("appData"), global.DIR_INSTANCE_LAUNCHER + global.FILE_SETTINGS);
                    fs.readFile(settingFile, 'utf8', (err, data) => {
                        if (err) {
                            reject(err)
                            return;
                        }
                        resolve(JSON.parse(data));
                    });
                });

                getSettingsPromise.then((settingsFile) => {
                    settingsContenu = settingsFile;
                    logger.debug("Contenu du fichier "+global.FILE_SETTINGS+" : "+JSON.stringify(settingsContenu));


                    if (settingsContenu.console === true && !consoleWindow){
                        launchConsole();
                    }

                    // CREER LE DOSSIER DE L'INSTANCE MC
                    const urlAsCreate = app.getPath("appData") + instanceChoose;
                    const verifInstanceDIR = new Promise((resolve, reject) => {
                        fs.mkdir(urlAsCreate, (err) => {
                            if (err) {
                                if (err.code === "EEXIST") {
                                    logger.warn("Le Dossier de l'instance a deja ete cree");
                                    resolve();
                                } else {
                                    reject(err);
                                }
                            } else {
                                logger.warn("Repertoire de l'instance cree avec succes.");
                                resolve();
                            }
                        });
                    });

                    verifInstanceDIR.then(() => {

                        // CREER LES FICHIER TOKEN D'USERITIUM
                        if (data.hereServer !== "vanilla") {

                            let usercachetyroservFile = path.join(app.getPath("appData"), instanceChoose + global.FILE_USER_TYROSERV);
                            let usercachetyroserva2fFile = path.join(app.getPath("appData"), instanceChoose + global.FILE_USER_TYROSERV_A2F);

                            const writeTokenPromise = new Promise((resolve, reject) => {
                                try {
                                    fs.writeFileSync(usercachetyroservFile, data.token_tyroserv);
                                    fs.writeFileSync(usercachetyroserva2fFile, data.token_tyroserv_a2f);
                                    resolve();
                                } catch (err) {
                                    reject(err);
                                }
                            });

                            writeTokenPromise.then(() => {
                                launchGame(event, data, instanceChoose, settingsContenu, modsFile)
                            }).catch((error) => {
                                stopGame(event, true);
                                logger.error("Erreur de creation des fichiers de securite");
                                logger.fatal(error.stack);
                            });
                        } else {
                            launchGame(event, data, instanceChoose, settingsContenu, modsFile)
                        }

                    }).catch((error) => {
                        stopGame(event, true);
                        logger.error("Erreur de creation du dossier de l'instance");
                        logger.fatal(error.stack);
                    });

                }).catch((error) => {
                    stopGame(event, true);
                    logger.error("Erreur de lecture du fichier '"+global.FILE_SETTINGS+"'");
                    logger.fatal(error.stack)
                });

            }).catch((error) => {
                stopGame(event, true);
                logger.error("Erreur avec le dossier '"+global.DIR_INSTANCE_MOD+"'");
                logger.fatal(error.stack)
            });

        }).catch((error) => {
            stopGame(event, true);
            logger.error("Erreur de lecture du fichier '"+global.FILE_MODS+"'");
            logger.fatal(error.stack)
        });
})

// LANCEMENT DU JEUX
let firstDownloadStatus = false;
let firstProgress = false;
function launchGame(event, data, instanceChoose, settingsContenu, modsFile){

    logger.info("Lancement du jeu ...");

    // CREER L'USER MC
    let TyroServUser = {
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

    /*
    * VARIABLE DE LANCMENT
    * */

    // MAIN JAR
    let instanceLaunch = path.join(app.getPath("appData"), instanceChoose)
    let mainJar = instanceLaunch + global.FILE_LAUNCH_GAME;
    logger.debug("Lancement de : "+mainJar);

    // PATH JAVA
    let javaPathCustom = instanceLaunch + global.DIR_JAVA_RUNTIME_WINDOWS;
    if (global.ENV_SYS === "linux"){
        javaPathCustom = instanceLaunch + global.DIR_JAVA_RUNTIME_LINUX;
    } else if (global.ENV_SYS === "mac"){
        javaPathCustom = instanceLaunch + global.DIR_JAVA_RUNTIME_MACOS;
    }
    logger.debug("Java Runtime : "+javaPathCustom);

    logger.info("Memoire utilise : " + settingsContenu.RamMin + "MB" + " / " + settingsContenu.RamMax + "MB")

    // CREER LES OPTIONS MC
    let options = {
        clientPackage: global.URL_INSTANCE_CLIENT, //null,
        authorization: TyroServUser,
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
            // "vps212.tyrolium.fr",
            // "--port",
            // "25566"
        ],
        root: instanceLaunch,
        javaPath: javaPathCustom,
        version: {
            number: "1.12.2",
            type: "release",
            // custom: "Forge 1.12.2"
        },
        forge:mainJar,
        memory: {
            max: settingsContenu.RamMax + "M",
            min: settingsContenu.RamMin + "M",
        },
    }

    launcher = new Client();
    launcher.launch(options);

    // Info de MCLC
    launcher.on('debug', (e) => {
        logMC("debug", e)

        if (e === "[MCLC]: Failed to start due to Error: Invalid or unsupported zip format. No END header found, closing...") {
            logger.error("Erreur avec le Fichier zip : 'clientPackage.zip'");
            logger.fatal(e);
            stopGame(event, true);
        }
        if (e === "[MCLC]: Downloaded assets") {
            logger.warn("Fin du telechargement des Assets Minecraft")
        }
    });

    // Information sur la progression du téléchargement
    launcher.on('download-status', (e) => {
        logMC("download-status", JSON.stringify(e))

        if (firstDownloadStatus === false){
            firstDownloadStatus = true;
            logger.warn("Demarrage du Telegargement de 'clientPackage.zip'");
        }

        event.sender.send("progressionDownload", e)
    });

    // Information sur ce qu'il télécharge
    launcher.on('download', (e) => {
        logMC("download", e)
        logger.warn("Fin du telechargement de '"+ e +"'");
    });

    // Information sur ce qu'il extrait
    launcher.on('package-extract', (e) => {
        logMC("package-extract", e)

        // Gestion des mods
        if (e.toString() === "true"){
            logger.warn("Extraction de 'clientPackage.zip'")

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

    // Donwload Assets MC
    launcher.on('progress', (e) => {
        logMC("progress", JSON.stringify(e))

        if (firstProgress === false){
            firstProgress = true;
            logger.warn("Demarrage du telegargement des Classes & Assets Minecraft");
        }

        event.sender.send("progression", e)
    });

    // Argument dès que le jeu ce lance
    launcher.on('arguments', (e) => {
        logMC("arguments", e)

        /*
        *
        * JEU LANCER
        *
        * */

        logger.info("Le launcher a correctement lance le jeu");

        // Front
        event.sender.send("startMC");

        // Caché le launcher si demander
        if (settingsContenu.showLauncher === false){ mainWindow.hide(); }

        // UPDATE DU REACH PRESENCE
        if (data.hereServer === "minigame"){
            setActivity('Joue à TyroServ Mini-Jeux', data.username_tyroserv);
        } else if (data.hereServer === "vanilla"){
            setActivity('Joue à Minecraft Vanilla', data.username_tyroserv);
        } else {
            setActivity('Joue à TyroServ PVP/Faction', data.username_tyroserv);
        }

    });

    // Contenu concret de Minecraft
    launcher.on('data', (e) => {
        logMC("data", e)
    });

    // Fermeture du jeu
    launcher.on('close', (e) => {
        logMC("close", e)
        stopGame(event, false);
    });

    // Launch -> Del All Mod -> Install Instance -> DeJar & Jar (activate) -> Launch Game
}

// Stop Game
function stopGame(event, isCrash = true){

    // Log
    if (isCrash){
        logger.error("Erreur lors du lancement du jeu")
    } else {
        logger.info("Jeu fermer correctement");
    }

    // Vidé la variable
    launcher = null;
    firstProgress = false;
    firstDownloadStatus = false;

    // Front
    mainWindow.show();
    event.sender.send("stopping", {crash:isCrash});

    // UPDATE DU REACH PRESENCE
    setActivity('Navigue sur le Launcher', userConnected.username_tyroserv);
}


/*
*
* ONGLET SECONDAIRE
*
* */


// ONGLET CONSOLE
let consoleWindow
ipcMain.on("launchConsole", () => {
    launchConsole();
})
function launchConsole(){
    consoleWindow = new BrowserWindow({
        frame: false,
        title: global.TITLE_ONGLET + "CONSOLE",
        width: 854,
        height: 480,
        minWidth: 854,
        minHeight: 480,
        resizable: true,
        icon: path.join(__dirname, "/asset/logo.png"),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            preload: path.join(__dirname, 'module/preload.js'),
        }
    })

    consoleWindow.loadFile('onglet/console.html');

    consoleWindow.on('closed', () => {
        consoleWindow = null;
    });

    ipcMain.on("manualCloseOnglet", () => {
        if (consoleWindow) {
            consoleWindow.close();
        }
    });
}

// ONGLET SETTINGS
let settingsWindow;
ipcMain.on("launchSettings", () => {

    settingsWindow = new BrowserWindow({
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
            preload: path.join(__dirname, 'module/preload.js'),
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
let modsWindow;
ipcMain.on("launchMods", () => {

    modsWindow = new BrowserWindow({
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
            preload: path.join(__dirname, 'module/preload.js'),
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
let versionWindow;
ipcMain.on("launchVersion", () => {

    versionWindow = new BrowserWindow({
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
            preload: path.join(__dirname, 'module/preload.js'),
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
        if (data.discord){
            event.reply('settingsFileUpdated', {success: true, discord: data.discord});
        } else {
            event.reply('settingsFileUpdated', {success: true});
        }

    } catch (err) {
        console.error('Erreur lors de la mise a jour du fichier :', err);

        // Gestion spécifique si le fichier n'existe pas
        if (err.code === 'ENOENT') {
            try {
                await fs.promises.writeFile(settingFile, JSON.stringify(data.newJson, null, 2));
                console.log('Nouveau fichier Launcher_Setting.json cree !');
                if (data.discord){
                    event.reply('settingsFileUpdated', {success: true, discord: data.discord});
                } else {
                    event.reply('settingsFileUpdated', {success: true});
                }
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

const DiscordRPC = require('discord-rpc');

// Variable
const clientId = global.DISCORD_CLIENT_ID;
let RPC = null;
let isConnected = false;

// Démarré Discord au Démarrage
connectDiscord();

// Connection à Discord
async function connectDiscord(reConnexion = false) {
    if (isConnected) return;

    if (!RPC) {
        RPC = new DiscordRPC.Client({ transport: 'ipc' });
        DiscordRPC.register(clientId);
        RPC.on('disconnected', handleDisconnected);
    }

    try {
        await RPC.login({ clientId });

        isConnected = true;
        console.log("Connexion Discord RPC reussie !");

        // Déclencher l'activité une fois connecté
        if (reConnexion){
            setActivity('Navigue sur le Launcher', userConnected.username_tyroserv)
        } else {
            setActivity('IDK', null);
        }

    } catch (error) {
        isConnected = false;
        console.error("Erreur de connexion Discord RPC : ", error.message);
        handleDisconnected();
    }
}

// Deconnexion de Discord
function handleDisconnected() {
    if (RPC) {
        try { RPC.destroy(); } catch (e) {}
        RPC = null;
    }
    isConnected = false;
}

// Déclanché une activité
async function setActivity(msg, pseudo){
    if (!RPC || !isConnected) return;

    // RECUPERATION DU FICHIER SETTINGS !
    const getSettingsPromise = new Promise((resolve, reject) => {
        let settingFileDiscord = path.join(app.getPath("appData"), global.DIR_INSTANCE_LAUNCHER + global.FILE_SETTINGS);
        fs.readFile(settingFileDiscord, 'utf8', (err, data) => {
            if (err) {
                reject(new Error("ERREUR AVEC LE FICHIER"))
                return;
            }
            resolve(JSON.parse(data));
        });
    });

    getSettingsPromise.then((settingFileDiscord) => {

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

// Dynamique BTN Settings
ipcMain.on("updateDiscord", (event, data) =>{
    // console.log("UpdatedDiscord : ", data.state);
    if (data.state === "stop") {
        if (RPC){
            handleDisconnected();
        }
    } else {
        connectDiscord(true);
    }
});


/*
*
* LOGGER & CRASH
*
* */

// Log Front
ipcMain.on('log-message', (event, data) => {
    const level = data.level || 'info';
    const message = `[FRONT] ${data.message}`;

    if (logger[level]) {
        logger[level](message);
    } else {
        logger.warn(`Tentative de log avec un niveau inconnu: ${level}`);
    }
});

// Log MCLC (Minecraft-launcher-core)
function logMC(type, message){
    logger.silly("["+type+"] " + message)
    if (consoleWindow){
        consoleWindow.send("consoleMC", "["+type+"] " + message);
    }
}

/* CrashFatal */
function crashFatal(content = null, err = null, killapp = false){
    if (!err){
        err = new Error("ERREUR INCONNUE") /* SI VIDE */
    }

    if (!content){
        content = "ERREUR INCONNUE";
    }

    logger.error(content) /* LOG */
    logger.fatal(err.stack) /* LOG */
    dialog.showErrorBox("ERREUR FATAL", content); /* MESSAGE USER */
    if (killapp){
        app.quit();
    }
    throw err; /* COUPER TOUT */

}