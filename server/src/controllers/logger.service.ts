import winston = require('winston');
import winstonDRF = require('winston-daily-rotate-file');
import mkdirp = require('mkdirp');
import path = require('path');

import TransportInstance = winston.TransportInstance;
import LoggerInstance = winston.LoggerInstance;
import { mainConfig } from './config.service';

class Logger {

  private logger: LoggerInstance;
  public info: any;
  public warn: any;
  public error: any;
  public debug: any;

  constructor() {
    let transports = this.createTransports();
    this.logger = new (winston.Logger)({transports: transports});
    this.info = this.logger.info;
    this.warn = this.logger.warn;
    this.error = this.logger.error;
    this.debug = this.logger.debug;
  }

  private createTransports(): Array<TransportInstance> {
    let consoleLogLevel = mainConfig.get('console_log_level');
    let transports = [];

    transports.push(
      new winston.transports.Console({
        level: consoleLogLevel,
        timestamp: function (): string {
          return Logger.getLogTimeStamp();
        },
        colorize: true
      }));

    let logDirs = {
      debug: path.join(__dirname, '../../logs/debug/'),
      info: path.join(__dirname, '../../logs/info/'),
      warn: path.join(__dirname, '../../logs/warning/'),
      error: path.join(__dirname, '../../logs/error/'),
    };

    for (let dirKey in logDirs) {
      if (logDirs[dirKey]) {
        mkdirp.sync(logDirs[dirKey]);
      }
    }

    let debugFilePath = logDirs.debug + '_plain.txt';
    let logFilePath = logDirs.info + '_plain.txt';
    let warnFilePath = logDirs.warn + '_plain.txt';
    let errFilePath = logDirs.error + '_plain.txt';
    let debugFileJSONPath = logDirs.debug + '_json.txt';
    let logFileJSONPath = logDirs.info + '_json.txt';
    let warnFileJSONPath = logDirs.warn + '_json.txt';
    let errFileJSONPath = logDirs.error + '_json.txt';

    transports.push(
      new winstonDRF({
        name: 'file#debug',
        datePattern: 'log_yyyy-MM-dd',
        level: 'debug',
        prepend: true,
        timestamp: function (): string {
          return Logger.getLogTimeStamp();
        },
        filename: debugFilePath,
        json: false
      }));

    transports.push(
      new winstonDRF({
        name: 'file#log',
        datePattern: 'log_yyyy-MM-dd',
        level: 'info',
        prepend: true,
        timestamp: function (): string {
          return Logger.getLogTimeStamp();
        },
        filename: logFilePath,
        json: false
      }));

    transports.push(
      new winstonDRF({
        name: 'file#warn',
        datePattern: 'log_yyyy-MM-dd',
        level: 'warn',
        prepend: true,
        timestamp: function (): string {
          return Logger.getLogTimeStamp();
        },
        filename: warnFilePath,
        json: false
      }));

    transports.push(
      new winstonDRF({
        name: 'file#error',
        datePattern: 'log_yyyy-MM-dd',
        level: 'error',
        prepend: true,
        timestamp: function (): string {
          return Logger.getLogTimeStamp();
        },
        filename: errFilePath,
        json: false
      }));

    transports.push(
      new winstonDRF({
        name: 'file#jsondebug',
        datePattern: 'log_yyyy-MM-dd',
        level: 'debug',
        prepend: true,
        timestamp: function (): string {
          return Logger.getLogTimeStamp();
        },
        filename: debugFileJSONPath
      }));

    transports.push(
      new winstonDRF({
        name: 'file#jsonlog',
        datePattern: 'log_yyyy-MM-dd',
        level: 'info',
        prepend: true,
        timestamp: function (): string {
          return Logger.getLogTimeStamp();
        },
        filename: logFileJSONPath
      }));

    transports.push(
      new winstonDRF({
        name: 'file#jsonwarn',
        datePattern: 'log_yyyy-MM-dd',
        level: 'warn',
        prepend: true,
        timestamp: function (): string {
          return Logger.getLogTimeStamp();
        },
        filename: warnFileJSONPath
      }));

    transports.push(
      new winstonDRF({
        name: 'file#jsonerror',
        datePattern: 'log_yyyy-MM-dd',
        level: 'error',
        prepend: true,
        timestamp: function (): string {
          return Logger.getLogTimeStamp();
        },
        filename: errFileJSONPath
      }));

    return transports;
  }

  private static getLogTimeStamp(): string {
    let now = new Date();
    let year = now.getFullYear();
    let month = ('0' + (now.getMonth() + 1)).slice(-2);
    let day = ('0' + now.getDate()).slice(-2);
    let hour = ('0' + now.getHours()).slice(-2);
    let minute = ('0' + now.getMinutes()).slice(-2);
    let second = ('0' + now.getSeconds()).slice(-2);
    let date = [year, month, day].join('-');
    let time = [hour, minute, second].join(':');
    return [date, time].join(' ');
  };
}

let logger = new Logger();
logger.info('Winston logger enabled');
export { logger };
