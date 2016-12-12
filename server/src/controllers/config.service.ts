import fs = require('fs');
import ini = require('ini');

import { logger } from './logger.service';

class Config {

  config: Object;
  configName: string;

  constructor(configName, allowedMissing = false) {
    this.configName = configName;
    this.config = ini.parse(fs.readFileSync(`./src/config/${configName}.ini`, 'utf-8'));
  }

  get(property: string) {
    if (this.config.hasOwnProperty(property)) {
      return this.config[property];
    } else {
      logger.warn(`Property ${property} does not exist in config ${this.configName}`);
      return null;
    }
  }
}

let mainConfig = new Config('main');
let dbConfig = new Config('database');
export { mainConfig, dbConfig };
