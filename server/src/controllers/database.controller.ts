import { createPool, Pool } from 'mysql2';
import { DataSource } from 'typeorm';

import { AppDataSource, getDatabaseCredentials } from '../data-source';
import { debug } from '../index';
import { QueryLogger } from '../loggers/query.logger';

export let db: DatabaseConnection;

export class DatabaseConnection {

    private static debug = debug.extend('database');

    public pool?: Pool;
    public orm?: DataSource;

    public constructor() {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        db = this;
    }

    public async connect(): Promise<void> {
        DatabaseConnection.debug(`Connecting to ${process.env.EVIE_DB_HOST}:${process.env.EVIE_DB_PORT}/${process.env.EVIE_DB_NAME}`);

        // A plain pool for the session store to use. TypeORM manages its own.
        await new Promise<void>((resolve) => {
            this.pool = createPool(getDatabaseCredentials());

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

        AppDataSource.setOptions({
            logger: new QueryLogger(),
            logging: ['query', 'error'],
        });

        this.orm = await AppDataSource.initialize();

        DatabaseConnection.debug('Database connected');
    }
}
