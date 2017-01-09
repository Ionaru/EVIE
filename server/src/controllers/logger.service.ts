import winston = require('winston');

import TransportInstance = winston.TransportInstance;
import LoggerInstance = winston.LoggerInstance;

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
    let consoleLogLevel = 'info';
    let transports = [];
    // noinspection JSUnusedGlobalSymbols
    transports.push(
      new winston.transports.Console({
        level: consoleLogLevel,
        timestamp: function (): string {
          return Logger.getLogTimeStamp();
        },
        colorize: true
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
