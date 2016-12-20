import Sequelize = require('sequelize');
import Instance = Sequelize.Instance;
import Model = Sequelize.Model;

import { db } from '../../controllers/db.service';
import { logger } from '../../controllers/logger.service';

export let User;

export interface UserAttr {
  id: number;
  pid: string;
  username: string;
  passwordHash: string;
  email: string;
  timesLogin: Date;
  lastLogin: Date;
  accounts: any;
}
export interface UserInstance extends Instance<UserAttr>, UserAttr { }
export interface UserModel extends Model<UserAttr, UserAttr> { }

export async function defineUser(): Promise<void> {
  User = await db.seq.define('users', {
    pid: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false,
    },
    username: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false,
    },
    passwordHash: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    email: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false,
    },
    timesLogin: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    lastLogin: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
      allowNull: false,
    },
  }).sync();

  // await User.create({
  //   pid: '1234abcd',
  //   username: 'testUser',
  //   passwordHash: '000999888',
  //   email: 'mail@example.com',
  // });

  logger.info('Model defined: User');
}
