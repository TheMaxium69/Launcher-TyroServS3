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

// Transport pour les erreurs
const errorTransport = new DailyRotateFile({
    level: 'error',
    filename: path.join(logPath, 'error-%DATE%.log'), // Utilisez %DATE% pour l'horodatage
    datePattern: 'DD-MM-YYYY', // Le format de date désiré (Ex: 27-11-2025)
    zippedArchive: false,      // N'archive pas les anciens fichiers
    maxSize: false,            // PAS de limite de taille de fichier
    maxFiles: false,           // PAS de limite de nombre de fichiers (jamais de suppression)
    format: logFormat          // Utilise le format de contenu défini plus haut
});

// Transport pour tous les logs (global)
const globalTransport = new DailyRotateFile({
    filename: path.join(logPath, 'global-%DATE%.log'), // Utilisez %DATE%
    datePattern: 'DD-MM-YYYY',
    zippedArchive: false,
    maxSize: false,
    maxFiles: false,
    format: logFormat
});

// Construction des logs
const logger = winston.createLogger({
    level: 'info', // Niveau minimum de log à enregistrer
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