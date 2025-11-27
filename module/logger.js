const winston = require('winston');
const { app } = require('electron');
const path = require('path');
const DailyRotateFile = require('winston-daily-rotate-file');
const global = require('../module/global.js');

/*
*
* GLOBAL
*
* */
const logPath = path.join(app.getPath("appData"), global.DIR_INSTANCE_LAUNCHER + global.DIR_INSTANCE_LOG);

// Définition de la structure de niveaux personnalisée
const customLevels = {
    // La sévérité la plus élevée a la valeur la plus faible (contrairement aux valeurs NPM par défaut)
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
    silly: 5
    // Note : Le niveau crit aura maintenant la plus haute priorité (valeur 0).
};

// Configuration des couleurs (mise à jour pour inclure 'crit')
const customColors = {
    fatal: 'magenta', // Couleur vive pour CRITIQUE (ou rouge intense)
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue',
    silly: 'gray'
};

winston.addColors(customColors);

const consoleLevelConsole = global.DEBUG_VIEW_MCLOG ? 'silly' : 'debug';

/*
*
* NATIV LOG
* global-27-11-2025.log (info, warn, error)
*
* */

// Définir le format des logs
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
    winston.format.printf(info => `[${info.timestamp}] [${info.level.toUpperCase()}] ${info.message}`),
);

// Cette fonction ne permet le passage d'AUCUN log de niveau 'fatal'.
const excludeFatalFilter = winston.format((info, opts) => {
    if (info.level === 'fatal' || info.level === "silly") {
        return false; // Exclut le log
    }
    return info; // Inclut tous les autres niveaux
});

// Transport pour tous les logs (global)
const globalTransport = new DailyRotateFile({
    filename: path.join(logPath, 'global/global-%DATE%'), // Utilisez %DATE%
    datePattern: 'DD-MM-YYYY',
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: false,
    extension: '.log',
    format: winston.format.combine(
        excludeFatalFilter(), // <-- Filtre qui retire FATAL
        logFormat
    ),
});

/*
*
* ERREUR LOG
* error-27-11-2025.log (seulement les erreurs)
*
* */

// Transport pour les erreurs
const errorTransport = new DailyRotateFile({
    level: 'error',
    filename: path.join(logPath, 'error/error-%DATE%'), // Utilisez %DATE% pour l'horodatage
    datePattern: 'DD-MM-YYYY', // Le format de date désiré (Ex: 27-11-2025)
    zippedArchive: true,      // N'archive pas les anciens fichiers
    maxSize: "20m",            // PAS de limite de taille de fichier
    maxFiles: false,           // PAS de limite de nombre de fichiers (jamais de suppression)
    extension: '.log',
    format: logFormat, // Utilise le format de contenu défini plus haut
});

/*
*
* MINECRAFT LOG
* mclc-27-11-2025.log (seulement les minecraft-launcher-core)
*
* */

const logFormatMC = winston.format.combine(
    winston.format.timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
    winston.format.printf(info => `${info.message}`),
);

const onlyMCFilter = winston.format((info, opts) => {
    if (info.level === "silly") {
        return info; // Exclut le log
    }
    return false;
});

// Transport pour les minecraft
const minecraftTransport = new DailyRotateFile({
    level: 'silly',
    filename: path.join(logPath, 'mclc/mclc-%DATE%'), // Utilisez %DATE% pour l'horodatage
    datePattern: 'DD-MM-YYYY', // Le format de date désiré (Ex: 27-11-2025)
    zippedArchive: true,      // N'archive pas les anciens fichiers
    maxSize: "20m",            // PAS de limite de taille de fichier
    maxFiles: false,           // PAS de limite de nombre de fichiers (jamais de suppression)
    extension: '.log',
    format: winston.format.combine(
        onlyMCFilter(), // <-- Filtre qui retire FATAL
        logFormatMC
    ),
});


/*
*
*
* CONSTRUCTION FINAL
*
*
* */


// Construction des logs
const logger = winston.createLogger({
    levels: customLevels,
    level: 'silly', // Niveau minimum de log à enregistrer
    format: logFormat,
    transports: [
        errorTransport,
        minecraftTransport,
        globalTransport,
        new winston.transports.Console({
            level: consoleLevelConsole,
            format: winston.format.combine(
                winston.format.colorize(),// Activer la coloration
                // winston.format.simple(),   // Gère le format d'affichage
                winston.format.printf(info => `[${info.level}] ${info.message}`),
            )
        })
    ]
});

module.exports = logger;