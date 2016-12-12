import Sequelize = require('sequelize');

import { db } from '../../controllers/db.service';
import { logger } from '../../controllers/logger.service';
import { User } from '../user/user';

export let Account;

export async function defineAccount() {
  Account = await db.seq.define('accounts', {
    pid: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    keyID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    vCode: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    isActive: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    userId: {
      type: Sequelize.INTEGER,
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      allowNull: false,
      references: {
        model: User,
      }
    }
  }).sync();

  User.hasMany(Account);

  // await Account.create({
  //   pid: '1234abcd',
  //   name: 'myKey',
  //   keyID: **,
  //   vCode: '***',
  //   userId: 1,
  // });

  logger.info('Model defined: Account');
}
