import fs = require('fs');
import mysql = require('mysql');
import { IPool } from 'mysql';
import path = require('path');
import SequelizeStatic = require('sequelize');
import { Sequelize } from 'sequelize';
import { configPath, dbConfig } from './config.service';
import { logger } from './logger.service';

class Database {

  public state: {
    mode: any;
    pool: null;
  };
  public seq: Sequelize;

  constructor() {
    this.state = {
      mode: null,
      pool: null,
    };
  }

  public connect(): void {
    let dbOptions = {};
    if (dbConfig.getProperty('db_ca_f') && dbConfig.getProperty('db_cc_f') && dbConfig.getProperty('db_ck_f')) {
      dbOptions = {
        // tslint:disable:object-literal-sort-keys
        dialect: 'mysql',
        host: dbConfig.getProperty('db_host'),
        port: dbConfig.getProperty('db_port'),
        user: dbConfig.getProperty('db_user'),
        password: dbConfig.getProperty('db_pass'),
        database: dbConfig.getProperty('db_name'),
        ssl: {
          ca: fs.readFileSync(path.join(configPath, dbConfig.getProperty('db_ca_f'))),
          cert: fs.readFileSync(path.join(configPath, dbConfig.getProperty('db_cc_f'))),
          key: fs.readFileSync(path.join(configPath, dbConfig.getProperty('db_ck_f'))),
          rejectUnauthorized: dbConfig.getProperty('db_reject'),
        },
        // tslint:enable:object-literal-sort-keys
      };
      if (!dbConfig.getProperty('db_reject')) {
        logger.warn('SSL connection to Database is not secure, \'db_reject\' should be \'true\'');
      }
    } else {
      dbOptions = {
        // tslint:disable:object-literal-sort-keys
        dialect: 'mysql',
        host: dbConfig.getProperty('db_host'),
        port: dbConfig.getProperty('db_port'),
        user: dbConfig.getProperty('db_user'),
        password: dbConfig.getProperty('db_pass'),
        database: dbConfig.getProperty('db_name'),
        // tslint:enable:object-literal-sort-keys
      };
      if (['localhost', '0.0.0.0', '127.0.0.1'].indexOf(dbConfig.getProperty('db_host')) === -1) {
        logger.warn('SSL connection to Database is not secure, \'db_reject\' should be \'true\'');
      }
    }
    this.state.pool = mysql.createPool(dbOptions);

    this.seq = new SequelizeStatic(dbConfig.getProperty('db_name'), dbConfig.getProperty('db_user'), dbConfig.getProperty('db_pass'), {
      // tslint:disable:object-literal-sort-keys
      dialect: 'mysql',
      host: dbConfig.getProperty('db_host'),
      port: dbConfig.getProperty('db_port'),
      dialectOptions: {
        ssl: {
          ca: fs.readFileSync(path.join(configPath, dbConfig.getProperty('db_ca_f'))),
          cert: fs.readFileSync(path.join(configPath, dbConfig.getProperty('db_cc_f'))),
          key: fs.readFileSync(path.join(configPath, dbConfig.getProperty('db_ck_f'))),
          rejectUnauthorized: dbConfig.getProperty('db_reject'),
        },
      },
      logging: null,
      // tslint:enable:object-literal-sort-keys
    });
  }

  public getPool(): IPool {
    return this.state.pool;
  }
}

const db = new Database();
export { db };
