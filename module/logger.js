const winston = require('winston');
const { app } = require('electron');
const path = require('path');
const DailyRotateFile = require('winston-daily-rotate-file');
const global = require('../module/global.js');

const logPath = path.join(app.getPath("appData"), global.DIR_INSTANCE_LAUNCHER + global.DIR_INSTANCE_LOG);

// Définir le format des logs
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
    winston.format.printf(info => `[${info.timestamp}] [${info.level.toUpperCase()}] ${info.message}`),
);

// Cette fonction ne permet le passage d'AUCUN log de niveau 'fatal'.
const excludeFatalFilter = winston.format((info, opts) => {
    if (info.level === 'fatal') {
        return false; // Exclut le log
    }
    return info; // Inclut tous les autres niveaux
});

// Transport pour les erreurs
const errorTransport = new DailyRotateFile({
    level: 'error',
    filename: path.join(logPath, 'error-%DATE%.log'), // Utilisez %DATE% pour l'horodatage
    datePattern: 'DD-MM-YYYY', // Le format de date désiré (Ex: 27-11-2025)
    zippedArchive: false,      // N'archive pas les anciens fichiers
    maxSize: false,            // PAS de limite de taille de fichier
    maxFiles: false,           // PAS de limite de nombre de fichiers (jamais de suppression)
    format: logFormat, // Utilise le format de contenu défini plus haut
});

// Transport pour tous les logs (global)
const globalTransport = new DailyRotateFile({
    filename: path.join(logPath, 'global-%DATE%.log'), // Utilisez %DATE%
    datePattern: 'DD-MM-YYYY',
    zippedArchive: false,
    maxSize: false,
    maxFiles: false,
    format: winston.format.combine(
        excludeFatalFilter(), // <-- Filtre qui retire FATAL
        logFormat
    ),
});

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

// Construction des logs
const logger = winston.createLogger({
    levels: customLevels,
    level: 'silly', // Niveau minimum de log à enregistrer
    format: logFormat,
    transports: [
        errorTransport, // Fichier: error-27-11-2025.log (seulement les erreurs)
        globalTransport, // Fichier: global-27-11-2025.log (info, warn, error)
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),// Activer la coloration
                // winston.format.simple(),   // Gère le format d'affichage
                winston.format.printf(info => `[${info.level}] ${info.message}`),
            )
        })
    ]
});

module.exports = logger;