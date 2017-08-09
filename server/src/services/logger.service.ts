import mkdirp = require('mkdirp');
import path = require('path');
import winston = require('winston');
import winstonDRF = require('winston-daily-rotate-file');

import TransportInstance = winston.TransportInstance;
import LoggerInstance = winston.LoggerInstance;

export let logger: Logger;

export class Logger {

  private static getLogTimeStamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = ('0' + (now.getMonth() + 1)).slice(-2);
    const day = ('0' + now.getDate()).slice(-2);
    const hour = ('0' + now.getHours()).slice(-2);
    const minute = ('0' + now.getMinutes()).slice(-2);
    const second = ('0' + now.getSeconds()).slice(-2);
    const date = [year, month, day].join('-');
    const time = [hour, minute, second].join(':');
    return [date, time].join(' ');
  }

  public info: any;
  public warn: any;
  public error: any;
  public debug: any;
  private logger: LoggerInstance;

  constructor() {
    let transports = this.createTransports();
    if (process.env.SILENT === 'true') {
      transports = [
        new winston.transports.Console({
          colorize: true,
          level: 'error',
          timestamp(): string {
            return Logger.getLogTimeStamp();
          },
        }),
      ];
    }

    this.logger = new (winston.Logger)({transports});
    this.info = this.logger.info;
    this.warn = this.logger.warn;
    this.error = this.logger.error;
    this.debug = this.logger.debug;

    this.info('Winston logger enabled');
  }

  private createTransports(): TransportInstance[] {
    const consoleLogLevel = process.env.LEVEL || 'info';
    const transports = [];

    transports.push(
      new winston.transports.Console({
        colorize: true,
        level: consoleLogLevel,
        timestamp(): string {
          return Logger.getLogTimeStamp();
        },
      }));

    const logDirs = {
      debug: path.join(__dirname, '../../logs/debug/'),
      error: path.join(__dirname, '../../logs/error/'),
      info: path.join(__dirname, '../../logs/info/'),
      warn: path.join(__dirname, '../../logs/warning/'),
    };

    for (const dirKey in logDirs) {
      if (logDirs[dirKey]) {
        mkdirp.sync(logDirs[dirKey]);
      }
    }

    const debugFilePath = logDirs.debug + '_plain.log';
    const logFilePath = logDirs.info + '_plain.log';
    const warnFilePath = logDirs.warn + '_plain.log';
    const errFilePath = logDirs.error + '_plain.log';
    const debugFileJSONPath = logDirs.debug + '_json.log';
    const logFileJSONPath = logDirs.info + '_json.log';
    const warnFileJSONPath = logDirs.warn + '_json.log';
    const errFileJSONPath = logDirs.error + '_json.log';

    transports.push(
      new winstonDRF({
        datePattern: 'log_yyyy-MM-dd',
        filename: debugFilePath,
        json: false,
        level: 'debug',
        name: 'file#debug',
        prepend: true,
        timestamp(): string {
          return Logger.getLogTimeStamp();
        },
      }));

    transports.push(
      new winstonDRF({
        datePattern: 'log_yyyy-MM-dd',
        filename: logFilePath,
        json: false,
        level: 'info',
        name: 'file#log',
        prepend: true,
        timestamp(): string {
          return Logger.getLogTimeStamp();
        },
      }));

    transports.push(
      new winstonDRF({
        datePattern: 'log_yyyy-MM-dd',
        filename: warnFilePath,
        json: false,
        level: 'warn',
        name: 'file#warn',
        prepend: true,
        timestamp(): string {
          return Logger.getLogTimeStamp();
        },
      }));

    transports.push(
      new winstonDRF({
        datePattern: 'log_yyyy-MM-dd',
        filename: errFilePath,
        json: false,
        level: 'error',
        name: 'file#error',
        prepend: true,
        timestamp(): string {
          return Logger.getLogTimeStamp();
        },
      }));

    transports.push(
      new winstonDRF({
        datePattern: 'log_yyyy-MM-dd',
        filename: debugFileJSONPath,
        level: 'debug',
        name: 'file#jsondebug',
        prepend: true,
        timestamp(): string {
          return Logger.getLogTimeStamp();
        },
      }));

    transports.push(
      new winstonDRF({
        datePattern: 'log_yyyy-MM-dd',
        filename: logFileJSONPath,
        level: 'info',
        name: 'file#jsonlog',
        prepend: true,
        timestamp(): string {
          return Logger.getLogTimeStamp();
        },
      }));

    transports.push(
      new winstonDRF({
        datePattern: 'log_yyyy-MM-dd',
        filename: warnFileJSONPath,
        level: 'warn',
        name: 'file#jsonwarn',
        prepend: true,
        timestamp(): string {
          return Logger.getLogTimeStamp();
        },
      }));

    transports.push(
      new winstonDRF({
        datePattern: 'log_yyyy-MM-dd',
        filename: errFileJSONPath,
        level: 'error',
        name: 'file#jsonerror',
        prepend: true,
        timestamp(): string {
          return Logger.getLogTimeStamp();
        },
      }));

    return transports;
  }
}
