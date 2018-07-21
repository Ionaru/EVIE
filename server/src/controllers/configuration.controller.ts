import * as fs from 'fs';
import * as ini from 'ini';
import * as path from 'path';
import { logger } from 'winston-pnp-logger';

export const configPath = path.join(__dirname, '../../../config/');

export let config: Configurator;

interface IConfig {
    [key: string]: boolean | number | string;
}

export class Configurator {

    private readonly config: IConfig = {};

    constructor() {
        config = this;
    }

    /**
     * Get a property from the config file
     * @param {string} property - The name of the property to fetch
     * @param {boolean | number | string} defaultValue - Default value to return if the property is not set.
     * @return {boolean | number | string | undefined} - The value of the given config property
     */
    public getProperty(property: string, defaultValue?: boolean | number | string): boolean | number | string | undefined {
        if (this.config.hasOwnProperty(property)) {
            return this.config[property];
        } else {
            logger.warn(`Property '${property}' does not exist in the current configuration.`);
            if (!defaultValue) {
                throw new Error(`No value or default value for property ${property} defined, application cannot start!`);
            }
            return defaultValue;
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
                    let warning = `Configuration value '${configEntry}' is being overwritten by ${configName}.ini`;
                    warning += `, old value: '${oldValue}', new value: '${newValue}'`;
                    logger.warn(warning);
                }
            }
        }

        Object.assign(this.config, configEntries);
        logger.info(`Config loaded: ${configName + '.ini'}`);
    }
}
