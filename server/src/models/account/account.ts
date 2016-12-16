import Sequelize = require('sequelize');
import Instance = Sequelize.Instance;
import Model = Sequelize.Model;

import { db } from '../../controllers/db.service';
import { logger } from '../../controllers/logger.service';
import { User } from '../user/user';

export let Account;

export interface AccountAttr {
  id: number;
  pid: string;
  name: string;
  keyID: number;
  vCode: string;
  isActive: boolean;
  selectedCharacter: number;
  userId: number;
}
export interface AccountInstance extends Instance<AccountAttr>, AccountAttr { }
export interface AccountModel extends Model<AccountAttr, AccountAttr> { }

export async function defineAccount(): Promise<void> {
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
    selectedCharacter: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
