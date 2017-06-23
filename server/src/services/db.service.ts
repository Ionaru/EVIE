import fs = require('fs');
import mysql = require('mysql');
import path = require('path');
import SequelizeStatic = require('sequelize');

import { dbConfig, configPath } from './config.service';
import { logger } from './logger.service';
import { IPool } from 'mysql';
import { Sequelize } from 'sequelize';


class Database {

  state: Object;
  seq: Sequelize;

  constructor() {
    this.state = {
      pool: null,
      mode: null,
    };
  }

  connect(): void {
    let dbOptions = {};
    if (dbConfig.get('db_ca_f') && dbConfig.get('db_cc_f') && dbConfig.get('db_ck_f')) {
      dbOptions = {
        dialect: 'mysql',
        host: dbConfig.get('db_host'),
        port: dbConfig.get('db_port'),
        user: dbConfig.get('db_user'),
        password: dbConfig.get('db_pass'),
        database: dbConfig.get('db_name'),
        ssl: {
          ca: fs.readFileSync(path.join(configPath, dbConfig.get('db_ca_f'))),
          cert: fs.readFileSync(path.join(configPath, dbConfig.get('db_cc_f'))),
          key: fs.readFileSync(path.join(configPath, dbConfig.get('db_ck_f'))),
          rejectUnauthorized: dbConfig.get('db_reject'),
        }
      };
      if (!dbConfig.get('db_reject')) {
        logger.warn('SSL connection to Database is not secure, \'db_reject\' should be \'true\'');
      }
    } else {
      dbOptions = {
        dialect: 'mysql',
        host: dbConfig.get('db_host'),
        port: dbConfig.get('db_port'),
        user: dbConfig.get('db_user'),
        password: dbConfig.get('db_pass'),
        database: dbConfig.get('db_name'),
      };
      if (['localhost', '0.0.0.0', '127.0.0.1'].indexOf(dbConfig.get('db_host')) === -1) {
        logger.warn('SSL connection to Database is not secure, \'db_reject\' should be \'true\'');
      }
    }
    this.state['pool'] = mysql.createPool(dbOptions);

    this.seq = new SequelizeStatic(dbConfig.get('db_name'), dbConfig.get('db_user'), dbConfig.get('db_pass'), {
      dialect: 'mysql',
      host: dbConfig.get('db_host'),
      port: dbConfig.get('db_port'),
      dialectOptions: {
        ssl: {
          ca: fs.readFileSync(path.join(configPath, dbConfig.get('db_ca_f'))),
          cert: fs.readFileSync(path.join(configPath, dbConfig.get('db_cc_f'))),
          key: fs.readFileSync(path.join(configPath, dbConfig.get('db_ck_f'))),
          rejectUnauthorized: dbConfig.get('db_reject'),
        }
      },
      logging: null
    });
  }

  get(): IPool {
    return this.state['pool'];
  }
}

const db = new Database();
export { db };
