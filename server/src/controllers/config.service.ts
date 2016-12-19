import fs = require('fs');
import ini = require('ini');
import path = require('path');

import { logger } from './logger.service';

export let configPath = path.join(__dirname, '../../../config/');

class Config {

  config: Object;
  configName: string;

  constructor(configName: string, allowedMissing: boolean = false) {
    this.configName = configName;
    try {
      // this.config = ini.parse(fs.readFileSync(`../../../config/${configName}.ini`, 'utf-8'));
      this.config = ini.parse(fs.readFileSync(path.join(configPath, configName + '.ini'), 'utf-8'));
    } catch (error) {
      if (error.code === 'ENOENT' && allowedMissing) {
        logger.warn(configName + '.ini was not found, some functionality will be disabled ' +
          'and application might misbehave.');
        this.config = {};
      } else {
        throw error;
      }
    }
  }

  get(property: string): any {
    if (this.config.hasOwnProperty(property)) {
      return this.config[property];
    } else {
      logger.warn(`Property '${property}' does not exist in config '${this.configName}.ini'`);
      return null;
    }
  }
}

let mainConfig = new Config('main');
let dbConfig = new Config('database');
let ssoConfig = new Config('sso');
export { mainConfig, dbConfig, ssoConfig };
