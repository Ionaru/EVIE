import * as fs from 'fs';
import { createPool, Pool } from 'mysql';
import * as path from 'path';
import { Connection, createConnection, Logger } from 'typeorm';

import { config, configPath, debug } from '../index';
import { QueryLogger } from '../loggers/query.logger';
import { Character } from '../models/character.model';
import { User } from '../models/user.model';

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

    private static debug = debug.extend('database');

    public pool?: Pool;
    public orm?: Connection;

    private readonly dbOptions: IDBOptions;

    constructor() {
        this.dbOptions = {
            database: config.getProperty('db_name') as string,
            dialect: 'mysql',
            entities: [
                User,
                Character,
            ],
            host: config.getProperty('db_host') as string,
            logger: new QueryLogger(),
            logging: ['query', 'error'],
            password: config.getProperty('db_pass') as string,
            port: Number(config.getProperty('db_port')) || 3306,
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
        DatabaseConnection.debug(`Connecting to ${this.dbOptions.host}:${this.dbOptions.port}/${this.dbOptions.database}`);

        if (this.dbOptions.ssl && !this.dbOptions.ssl.rejectUnauthorized) {
            process.emitWarning('SSL connection to Database is not secure, \'db_reject\' should be true');
        } else if (!this.dbOptions.ssl) {
            if (['localhost', '0.0.0.0', '127.0.0.1'].indexOf(config.getProperty('db_host') as string) === -1) {
                process.emitWarning('Connection to Database is not secure, always use SSL to connect to external databases!');
            }
        }

        await new Promise<void>((resolve) => {
            this.pool = createPool(this.dbOptions);

            this.pool.on('connection', () => {
                resolve();
            });

            this.pool.on('error', (err) => {
                throw err;
            });

            this.pool.getConnection((err) => {
                if (err) {
                    throw err;
                }
            });
        });

        if (this.dbOptions.synchronize) {
            process.emitWarning('Database synchronize is enabled');
        }

        this.orm = await createConnection(this.dbOptions);

        DatabaseConnection.debug('Database connected');
    }
}
