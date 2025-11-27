const global = require('../module/global.js');
const { ipcRenderer } = require('electron');

/* LOGGER */
window.logger = {
    log: (level, message) => {
        ipcRenderer.send('log-message', { level, message });
    },
    info: (message) => {
        ipcRenderer.send('log-message', { level: "info", message });
    },
    warn: (message) => {
        ipcRenderer.send('log-message', { level: "warn", message });
    },
    error: (message) => {
        ipcRenderer.send('log-message', { level: "error", message });
    },
    fatal: (message) => {
        ipcRenderer.send('log-message', { level: "fatal", message });
    },
    silly: (message) => {
        ipcRenderer.send('log-message', { level: "silly", message });
    },
    debug: (message) => {
        ipcRenderer.send('log-message', { level: "debug", message });
    }
};

/* GLOBAL */
window.NAME_LAUNCHER = global.NAME_LAUNCHER;

window.FIRST_WINDOW_RESIZABLE = global.FIRST_WINDOW_RESIZABLE;

window.ONGLET_MOD_NAME = global.ONGLET_MOD_NAME
window.ONGLET_SETTING_NAME = global.ONGLET_SETTING_NAME
window.ONGLET_VERSION_NAME = global.ONGLET_VERSION_NAME

window.TIMEOUT_REQUEST = global.TIMEOUT_REQUEST;
window.DELAY_REQUEST = global.DELAY_REQUEST;

window.DEFAULT_MIN_PLAYER = global.DEFAULT_MIN_PLAYER
window.DEFAULT_MAX_PLAYER = global.DEFAULT_MAX_PLAYER

/* URL */
window.IP_SERVER_MC = global.IP_SERVER_MC
window.IP_SERVER_PING = global.IP_SERVER_PING
window.API_GET_TYROSERV = global.API_GET_TYROSERV

window.URL_USERITIUM_SKIN_HEAD = global.URL_USERITIUM_SKIN_HEAD
window.URL_OFFICIEL_SKIN_HEAD = global. URL_OFFICIEL_SKIN_HEAD

window.URL_USERITIUM_INSCRIPTION = global.URL_USERITIUM_INSCRIPTION
window.URL_USERITIUM_MDP = global.URL_USERITIUM_MDP
window.URL_USERITIUM_PP = global.URL_USERITIUM_PP
window.URL_GENERATE_PP = global.URL_GENERATE_PP

window.API_USERITIUM_CONNEXION = global.API_USERITIUM_CONNEXION
window.API_USERITIUM_TOKEN = global.API_USERITIUM_TOKEN

window.URL_TYROSERV_SITEWEB = global.URL_TYROSERV_SITEWEB
window.URL_TYROSERV_SITEWEB_PLAYER = global.URL_TYROSERV_SITEWEB_PLAYER
window.URL_TYROSERV_SITEWEB_CGU = global.URL_TYROSERV_SITEWEB_CGU
window.URL_TYROSERV_SITEWEB_CGV = global.URL_TYROSERV_SITEWEB_CGV
window.URL_TYROSERV_SITEWEB_TERMS = global.URL_TYROSERV_SITEWEB_TERMS

window.URL_TYROSERV_BOUTIQUE = global.URL_TYROSERV_BOUTIQUE

window.GET_NB_PLAYER = global.GET_NB_PLAYER