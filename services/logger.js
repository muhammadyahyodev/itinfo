const config = require("config");
require("winston-mongodb");

const { createLogger, format, transports } = require("winston");
const { combine, timestamp, printf, prettyPrint, json, colorize } = format;

const myFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp}  ${level}: ${message}`;
});


const devLog = createLogger({
  format: combine(timestamp(), myFormat),
  transports: [
    new transports.Console({ level: "debug" }),                                          // Console'ning ichidagi obyekt bo'lmasa debug ishlamaydi!
    new transports.File({ filename: "logs/errors.log", level: "error" }),                // error'larni alohida faylga joylamoqda
    new transports.File({ filename: "logs/combined.log", level: "info" }),               // umumlashtirib bir faylga joylamoqda
    new transports.MongoDB({
      db: config.get("dbUri"),
      options: { useUnifiedTopology: true },
      metaKey: {},
    }),
  ],
  exceptionHandlers: [new transports.File({ filename: "logs/exceptions.log" })],
  rejectionHandlers: [new transports.File({ filename: "logs/regections.log" })],
});


const prodLog = createLogger({
  format: combine(timestamp(), myFormat,),
  transports: [
    new transports.Console({ level: "debug" }),                                          // Console'ning ichidagi obyekt bo'lmasa debug ishlamaydi!
    new transports.File({ filename: "logs/errors.log", level: "error" }),                // error'larni alohida faylga joylamoqda
    new transports.MongoDB({
      db: config.get("dbUri"),
      options: { useUnifiedTopology: true },
      metaKey: {},
    }),
  ],
  exceptionHandlers: [new transports.File({ filename: "logs/exceptions.log" })],
  rejectionHandlers: [new transports.File({ filename: "logs/regections.log" })],
});

let logger;
if (process.env.NODE_ENV == "production") {
  logger = prodLog
} else {
  logger = devLog;
}


// logger.exitOnError = false
module.exports = logger;
