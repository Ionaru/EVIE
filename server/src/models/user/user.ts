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
  timesLogin: number;
  lastLogin: Date;
  characters: any;
}

/* tslint:disable:no-empty-interface */
export interface UserInstance extends Instance<UserAttr>, UserAttr { }
export interface UserModel extends Model<UserAttr, UserAttr> { }
/* tslint:enable:no-empty-interface */

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

  // const bcrypt = require('bcrypt');
  // await User.create({
  //   pid: '1234abcd',
  //   username: 'testUser',
  //   passwordHash: bcrypt.hashSync('KrNZYmR2uhWERtgCKrQ8DjBxsIr8yWUkU/4Mi+ePhtM=', 8),
  //   email: 'mail@example.com',
  // });

  logger.info('Model defined: User');
}
