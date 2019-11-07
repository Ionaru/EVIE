/**
 * @file Manages the configuration settings for the TypeORM.
 */

const fs = require('fs');

const runningMigration = process.argv.length >= 3 && process.argv[2].includes('migration');
const runningTSMain = process.argv[1].includes('index.ts');

const models = [
    'character.model',
    'user.model',
];

const database = process.env.EVIE_DB_NAME;
const host = process.env.EVIE_DB_HOST;
const port = process.env.EVIE_DB_PORT;
const username = process.env.EVIE_DB_USER;
const password = process.env.EVIE_DB_PASS;

const connectionOptions = {
    database,
    type: 'mysql',
    timezone: 'Z',
    host,
    port,
    username,
    password,
};

if (process.env.EVIE_DB_SSL_CA && process.env.EVIE_DB_SSL_CERT && process.env.EVIE_DB_SSL_KEY) {
    const rejectUnauthorized = process.env.EVIE_DB_SSL_REJECT ? process.env.EVIE_DB_SSL_REJECT.toLowerCase() === 'true' : true;

    connectionOptions['ssl'] = {
        ca: fs.readFileSync(process.env.EVIE_DB_SSL_CA),
        cert: fs.readFileSync(process.env.EVIE_DB_SSL_CERT),
        key: fs.readFileSync(process.env.EVIE_DB_SSL_KEY),
        rejectUnauthorized,
    };

    if (!rejectUnauthorized) {
        process.emitWarning('SSL connection to Database is not secure, \'db_reject\' should be true');
    }
}

if (!connectionOptions.ssl && !['localhost', '0.0.0.0', '127.0.0.1'].includes(connectionOptions.host)) {
    process.emitWarning('Connection to Database is not secure, always use SSL to connect to external databases!');
}

if (runningMigration || runningTSMain) {
    connectionOptions.entities = models.map((model) => `src/models/${model}.ts`);
} else {
    connectionOptions.entities = models.map((model) => `dist/src/models/${model}.js`);
}

if (runningMigration) {
    connectionOptions.cli = {
        migrationsDir: 'migrations',
    };
    connectionOptions.migrations = ['migrations/*.ts'];
    connectionOptions.migrationsTableName = 'migrations';
}

module.exports = connectionOptions;
