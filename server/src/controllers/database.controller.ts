import * as fs from 'fs';

import { createPool, Pool, PoolConfig } from 'mysql';
import { Connection, createConnection, getConnectionOptions } from 'typeorm';

import { debug } from '../index';
import { QueryLogger } from '../loggers/query.logger';

export let db: DatabaseConnection;

export class DatabaseConnection {

    private static debug = debug.extend('database');

    public pool?: Pool;
    public orm?: Connection;

    private readonly dbOptions: PoolConfig;

    public constructor() {
        const database = process.env.EVIE_DB_NAME;
        const host = process.env.EVIE_DB_HOST;
        const password = process.env.EVIE_DB_PASS;
        const port = Number(process.env.EVIE_DB_PORT);
        const user = process.env.EVIE_DB_USER;

        this.dbOptions = {
            database,
            host,
            password,
            port,
            user,
        };

        const rejectUnauthorized = process.env.EVIE_DB_SSL_REJECT ? process.env.EVIE_DB_SSL_REJECT.toLowerCase() === 'true' : true;

        if (process.env.EVIE_DB_SSL_CA && process.env.EVIE_DB_SSL_CERT && process.env.EVIE_DB_SSL_KEY) {
            this.dbOptions.ssl = {
                ca: fs.readFileSync(process.env.EVIE_DB_SSL_CA),
                cert: fs.readFileSync(process.env.EVIE_DB_SSL_CERT),
                key: fs.readFileSync(process.env.EVIE_DB_SSL_KEY),
                rejectUnauthorized,
            };
        }

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        db = this;
    }

    public async connect(): Promise<void> {
        DatabaseConnection.debug(`Connecting to ${process.env.EVIE_DB_HOST}:${process.env.EVIE_DB_PORT}/${process.env.EVIE_DB_NAME}`);

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

        const connectionOptions = await getConnectionOptions();

        Object.assign(connectionOptions, {
            logger: new QueryLogger(),
            logging: ['query', 'error'],
        });

        this.orm = await createConnection(connectionOptions);

        DatabaseConnection.debug('Database connected');
    }
}
