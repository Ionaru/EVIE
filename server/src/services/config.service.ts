import fs = require('fs');
import ini = require('ini');
import path = require('path');
import { logger } from 'winston-pnp-logger';

interface IConfig {
  [key: string]: boolean | number | string;
}

export const configPath = path.join(__dirname, '../../../config/');

export let config: Configurator;

export class Configurator {

  public config: IConfig = {};

  constructor() {
    config = this;
  }

  /**
   * Get a property from the config file
   * @param {string} property - The name of the property to fetch
   * @return {any | null} - The value of the given config property
   */
  public getProperty(property: string): any | null {
    if (this.config.hasOwnProperty(property)) {
      return this.config[property];
    } else {
      logger.warn(`Property '${property}' does not exist in the current configuration.`);
      return null;
    }
  }

  /**
   * Read the config from one of the config files and store the gotten values in this.config
   */
  public addConfigFile(configName: string) {
    // Read the config file from the config folder in the project root directory
    const configEntries = ini.parse(fs.readFileSync(path.join(configPath, configName + '.ini'), 'utf-8'));

    // Check if a value if being overwritten.
    for (const configEntry in configEntries) {
      if (configEntries.hasOwnProperty(configEntry)) {
        if (this.config[configEntry]) {
          const oldValue = this.config[configEntry];
          const newValue = configEntries[configEntry];
          logger.warn(
            `Value '${configEntry}' is being overwritten by ${configName}.ini, old value: '${oldValue}', new value: '${newValue}'`);
        }
      }
    }

    this.config = Object.assign(this.config, configEntries);
    logger.info(`Config loaded: ${configName + '.ini'}`);
  }
}
