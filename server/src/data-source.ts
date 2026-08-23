/**
 * @file The TypeORM DataSource, shared by the application and the migration CLI.
 *
 * This file must not import anything from the application itself. The TypeORM
 * CLI loads it directly, and pulling in `../index` would boot the whole server
 * just to run a migration.
 */

import * as fs from 'fs';
import * as path from 'path';

import { SslOptions } from 'mysql2';
import { DataSource } from 'typeorm';

import { Blueprint } from './models/blueprint.model';
import { Character } from './models/character.model';
import { User } from './models/user.model';

export interface IDatabaseCredentials {
    database?: string;
    host?: string;
    password?: string;
    port: number;
    ssl?: SslOptions;
    user?: string;
}

const getSSLOptions = (): SslOptions | undefined => {
    const ca = process.env.EVIE_DB_SSL_CA;
    const cert = process.env.EVIE_DB_SSL_CERT;
    const key = process.env.EVIE_DB_SSL_KEY;

    if (!ca || !cert || !key) {
        return undefined;
    }

    const rejectUnauthorized = process.env.EVIE_DB_SSL_REJECT
        ? process.env.EVIE_DB_SSL_REJECT.toLowerCase() === 'true'
        : true;

    if (!rejectUnauthorized) {
        process.emitWarning('SSL connection to Database is not secure, \'EVIE_DB_SSL_REJECT\' should be true');
    }

    return {
        ca: fs.readFileSync(ca),
        cert: fs.readFileSync(cert),
        key: fs.readFileSync(key),
        rejectUnauthorized,
    };
};

export const getDatabaseCredentials = (): IDatabaseCredentials => {
    const host = process.env.EVIE_DB_HOST;
    const ssl = getSSLOptions();

    if (!ssl && !['localhost', '0.0.0.0', '127.0.0.1'].includes(host as string)) {
        process.emitWarning('Connection to Database is not secure, always use SSL to connect to external databases!');
    }

    return {
        database: process.env.EVIE_DB_NAME,
        host,
        password: process.env.EVIE_DB_PASS,
        port: Number(process.env.EVIE_DB_PORT),
        ssl,
        user: process.env.EVIE_DB_USER,
    };
};

const credentials = getDatabaseCredentials();

export const AppDataSource = new DataSource({
    database: credentials.database,
    entities: [Blueprint, Character, User],
    host: credentials.host,

    // Resolved from this file, so it points at `migrations/` next to `src/` when
    // running from source and next to `dist/src/` when running the build.
    migrations: [path.join(__dirname, '..', 'migrations', '*.{js,ts}')],
    migrationsTableName: 'migrations',
    password: credentials.password,
    port: credentials.port,
    ssl: credentials.ssl,
    timezone: 'Z',
    type: 'mysql',
    username: credentials.user,
});
