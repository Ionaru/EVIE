import * as fs from 'fs';
import { createPool, Pool } from 'mysql';
import * as path from 'path';
import { Connection, createConnection, Logger } from 'typeorm';
import { logger } from 'winston-pnp-logger';

import { QueryLogger } from '../loggers/query.logger';
import { Character } from '../models/character.model';
import { Settings } from '../models/settings.model';
import { User } from '../models/user.model';
import { config, configPath } from './configuration.controller';

interface IDBOptions {
    database: string;
    dialect: 'mysql';
    host: string;
    password: string;
    port: number;
    user: string;
    ssl?: {
        ca: string;
        cert: string;
        key: string;
        rejectUnauthorized: boolean;
    };
    type: 'mysql';
    username: string;
    synchronize: boolean;
    logging: ['query', 'error'];
    logger: Logger;
    entities: any[];
}

export let db: DatabaseConnection;

export class DatabaseConnection {

    public pool?: Pool;
    public orm?: Connection;

    private dbOptions: IDBOptions;

    constructor() {
        this.dbOptions = {
            database: config.getProperty('db_name') as string,
            dialect: 'mysql',
            entities: [
                User,
                Character,
                Settings,
            ],
            host: config.getProperty('db_host') as string,
            logger: new QueryLogger(),
            logging: ['query', 'error'],
            password: config.getProperty('db_pass') as string,
            port: config.getProperty('db_port') as number || 3306,
            synchronize: config.getProperty('db_synchronize') as boolean,
            type: 'mysql',
            user: config.getProperty('db_user') as string,
            username: config.getProperty('db_user') as string,
        };

        const sslCA = config.getProperty('db_ca_f') as string;
        const sslCert = config.getProperty('db_cc_f') as string;
        const sslKey = config.getProperty('db_ck_f') as string;
        if (sslCA && sslCert && sslKey) {
            this.dbOptions.ssl = {
                ca: fs.readFileSync(path.join(configPath, sslCA)).toString(),
                cert: fs.readFileSync(path.join(configPath, sslCert)).toString(),
                key: fs.readFileSync(path.join(configPath, sslKey)).toString(),
                rejectUnauthorized: config.getProperty('db_reject') as boolean,
            };
        }

        db = this;
    }

    public async connect(): Promise<void> {
        if (this.dbOptions.ssl && !this.dbOptions.ssl.rejectUnauthorized) {
            logger.warn('SSL connection to Database is not secure, \'db_reject\' should be true');
        } else if (!this.dbOptions.ssl) {
            if (['localhost', '0.0.0.0', '127.0.0.1'].indexOf(config.getProperty('db_host') as string) === -1) {
                logger.warn('Connection to Database is not secure, always use SSL to connect to external databases!');
            }
        }

        this.pool = createPool(this.dbOptions);
        this.orm = await createConnection(this.dbOptions);

        logger.info('Database connected');
    }
}
