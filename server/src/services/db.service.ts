import * as fs from 'fs';
import * as mysql from 'mysql';
import * as path from 'path';
import { Connection, createConnection } from 'typeorm';
import { logger } from 'winston-pnp-logger';

import { Character } from '../models/character.model';
import { User } from '../models/user.model';
import { config, configPath } from './config.service';

class Database {

  public pool: mysql.Pool;
  public orm: Connection;

  public async connect(): Promise<void> {
    let dbOptions = {};

    if (config.getProperty('db_ca_f') && config.getProperty('db_cc_f') && config.getProperty('db_ck_f')) {
      dbOptions = {
        // tslint:disable:object-literal-sort-keys
        dialect: 'mysql',
        host: config.getProperty('db_host'),
        port: config.getProperty('db_port'),
        user: config.getProperty('db_user'),
        password: config.getProperty('db_pass'),
        database: config.getProperty('db_name'),
        ssl: {
          ca: fs.readFileSync(path.join(configPath, config.getProperty('db_ca_f'))),
          cert: fs.readFileSync(path.join(configPath, config.getProperty('db_cc_f'))),
          key: fs.readFileSync(path.join(configPath, config.getProperty('db_ck_f'))),
          rejectUnauthorized: config.getProperty('db_reject'),
        },
        // tslint:enable:object-literal-sort-keys
      };
      if (!config.getProperty('db_reject')) {
        logger.warn('SSL connection to Database is not secure, \'db_reject\' should be \'true\'');
      }
    } else {
      dbOptions = {
        // tslint:disable:object-literal-sort-keys
        dialect: 'mysql',
        host: config.getProperty('db_host'),
        port: config.getProperty('db_port'),
        user: config.getProperty('db_user'),
        password: config.getProperty('db_pass'),
        database: config.getProperty('db_name'),
        // tslint:enable:object-literal-sort-keys
      };
      if (['localhost', '0.0.0.0', '127.0.0.1'].indexOf(config.getProperty('db_host')) === -1) {
        logger.warn('SSL connection to Database is not secure, \'db_reject\' should be \'true\'');
      }
    }
    this.pool = mysql.createPool(dbOptions);

    this.orm = await createConnection({
      database: config.getProperty('db_name'),
      entities: [
        User,
        Character,
      ],
      host: config.getProperty('db_host'),
      logging: 'all',
      password: config.getProperty('db_pass'),
      port: config.getProperty('db_port'),
      ssl: {
        ca: fs.readFileSync(path.join(configPath, config.getProperty('db_ca_f'))),
        cert: fs.readFileSync(path.join(configPath, config.getProperty('db_cc_f'))),
        key: fs.readFileSync(path.join(configPath, config.getProperty('db_ck_f'))),
        rejectUnauthorized: config.getProperty('db_reject'),
      },
      synchronize: true,
      type: 'mysql',
      username: config.getProperty('db_user'),
    });
  }

  public getPool(): mysql.Pool {
    return this.pool;
  }
}

const db = new Database();
export { db };
