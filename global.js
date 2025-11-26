
/* LOGIQUE */

const IS_PROD = (process.env.NODE_ENV === 'prod' || process.env.ELECTRON_ENV === 'prod');


/* GLOBAL */

const NAME_LAUNCHER = "TyroServ Launcher"
const VERSION_LAUNCHER = "0.1.9";

const FIRST_WINDOW_WIDHT = 1318;
const FIRST_WINDOW_HEIGHT = 710;
const FIRST_WINDOW_RESIZABLE = false;

const ONGLET_WIDHT = 830;
const ONGLET_HEIGHT = 660;
const ONGLET_RESIZABLE = false;

const DISCORD_CLIENT_ID = "849915439844687893";


/* DIR & FILE */

const PROD_DIR_INSTANCE = "/.TyroServ/";
const DEV_DIR_INSTANCE = "/.TyroServBeta/";

const DIR_INSTANCE_LAUNCHER = (IS_PROD ? PROD_DIR_INSTANCE : DEV_DIR_INSTANCE) + "Launcher/";
const DIR_INSTANCE_FACTION = (IS_PROD ? PROD_DIR_INSTANCE : DEV_DIR_INSTANCE) + "TyroServ-Faction/";
const DIR_INSTANCE_MINIGAME = (IS_PROD ? PROD_DIR_INSTANCE : DEV_DIR_INSTANCE) + "TyroServ-MiniGame/";
const DIR_INSTANCE_VANILLA = (IS_PROD ? PROD_DIR_INSTANCE : DEV_DIR_INSTANCE) + "TyroServ-Vanilla/";

const DIR_INSTANCE_MOD = "/mods";

const FILE_CACHE = "Launcher_Cache.json";
const FILE_SETTINGS = "Launcher_Setting.json";
const FILE_MODS = "Launcher_Mods.json";

const FILE_USER_TYROSERV = "usercachetyroserv.json";
const FILE_USER_TYROSERV_A2F = "usercachetyroserva2f.json";

const FILE_LAUNCH_GAME = "Launch.jar";

/* URL */

const PROD_IP_SERVER_MC = "mc.tyroserv.fr";
const PROD_PORT_SERVER_MC = "";
const DEV_IP_SERVER_MC = "vps212.tyrolium.fr";
const DEV_PORT_SERVER_MC = ":25566";

const PROD_IP_SERVER_PING = "vps212.tyrolium.fr";
const PROD_PROTCOLE_SERVER_PING = "https://";
const DEV_IP_SERVER_PING = "http://127.0.0.1/Tyrolium-Uptime-InServer";
const DEV_PROTCOLE_SERVER_PING = "http://";

const PROD_API_GET_TYROSERV = "api-minecraft.tyroserv.fr";
const PROD_API_GET_TYROSERV_PROTOCOLE = "https://";
const DEV_API_GET_TYROSERV = "api-minecraft.tyroserv.fr";
const DEV_API_GET_TYROSERV_PROTOCOLE = "https://";

const URL_USERITIUM_PP = "https://useritium.fr/uploads/pp/";
const URL_GENERATE_PP = "https://tyrolium.fr/generate-pp/";

const SKALE_USERITIUM_SKIN = "20";
const URL_USERITIUM_SKIN_HEAD = "https://useritium.fr/uploads/skin/headView.php?scale=" + SKALE_USERITIUM_SKIN;
const URL_OFFICIEL_SKIN_HEAD = "https://minotar.net/helm/";

const PROD_URL_TYROSERV_SITEWEB = "tyroserv.fr";
const PROD_PROTOCOLE_TYROSERV_SITEWEB = "https://";
const DEV_URL_TYROSERV_SITEWEB = "beta.tyroserv.fr";
const DEV_PROTOCOLE_TYROSERV_SITEWEB = "https://";

const URL_TYROSERV_SITEWEB_PLAYER = (IS_PROD ? PROD_PROTOCOLE_TYROSERV_SITEWEB + PROD_URL_TYROSERV_SITEWEB : DEV_PROTOCOLE_TYROSERV_SITEWEB + DEV_URL_TYROSERV_SITEWEB) + "/player/";

const URL_INSTANCE_CLIENT = "http://tyrolium.fr/Download/TyroServS3/instance.zip";

const API_GET_INFO_LAUNCHER = "https://tyrolium.fr/Download/TyroServS3/launcher/index.php";


/* REQUEST */

const GET_NB_PLAYER = "https://mcapi.xdefcon.com/server/" + (IS_PROD ? PROD_IP_SERVER_MC + PROD_PORT_SERVER_MC : DEV_IP_SERVER_MC + DEV_PORT_SERVER_MC) + "/full/json";


module.exports = {

    /* GLOBAL */
    TITLE_FIRST_WINDOW: NAME_LAUNCHER + " - " + VERSION_LAUNCHER,
    TITLE_ONGLET: NAME_LAUNCHER + " - ",
    FIRST_WINDOW_WIDHT: FIRST_WINDOW_WIDHT,
    FIRST_WINDOW_HEIGHT: FIRST_WINDOW_HEIGHT,
    FIRST_WINDOW_RESIZABLE: FIRST_WINDOW_RESIZABLE,
    ONGLET_WIDHT: ONGLET_WIDHT,
    ONGLET_HEIGHT: ONGLET_HEIGHT,
    ONGLET_RESIZABLE: ONGLET_RESIZABLE,
    DISCORD_CLIENT_ID: DISCORD_CLIENT_ID,

    /* DIR */
    DIR_INSTANCE: IS_PROD ? PROD_DIR_INSTANCE : DEV_DIR_INSTANCE,
    DIR_INSTANCE_LAUNCHER: DIR_INSTANCE_LAUNCHER,
    DIR_INSTANCE_FACTION: DIR_INSTANCE_FACTION,
    DIR_INSTANCE_MINIGAME: DIR_INSTANCE_MINIGAME,
    DIR_INSTANCE_VANILLA: DIR_INSTANCE_VANILLA,


    /* URL */
    URL_TYROSERV_SITEWEB: IS_PROD ? PROD_PROTOCOLE_TYROSERV_SITEWEB + PROD_URL_TYROSERV_SITEWEB : DEV_PROTOCOLE_TYROSERV_SITEWEB + DEV_URL_TYROSERV_SITEWEB

};