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
      // Try to read the config file from the config folder in the project root directory
      this.config = ini.parse(fs.readFileSync(path.join(configPath, configName + '.ini'), 'utf-8'));
    } catch (error) {
      // Config file was not found
      if (error.code === 'ENOENT' && allowedMissing) {
        // Config file is allowed to be missing, but the application might miss functionality
        logger.warn(configName + '.ini was not found, some functionality will be disabled ' +
          'and application might misbehave.');
        this.config = {};
      } else {
        // The config is essential for the application, throw an error
        throw error;
      }
    }
  }

  /**
   * Get a property from a config file
   * params:
   *  property: The name of the property to fetch
   * returns: The value of the given config property
   */
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
