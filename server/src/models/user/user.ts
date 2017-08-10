import Sequelize = require('sequelize');
import Instance = Sequelize.Instance;
import Model = Sequelize.Model;

import { logger } from 'winston-pnp-logger';
import { db } from '../../services/db.service';

export let userModel;

export interface IUserAttr {
  id: number;
  pid: string;
  username: string;
  passwordHash: string;
  email: string;
  timesLogin: number;
  lastLogin: Date;
  characters: any;
}

// tslint:disable:no-empty-interface
export interface IUserInstance extends Instance<IUserAttr>, IUserAttr { }
export interface IUserModel extends Model<IUserAttr, IUserAttr> { }
// tslint:enable:no-empty-interface

export async function defineUser(): Promise<void> {
  userModel = await db.seq.define('users', {
    // tslint:disable:object-literal-sort-keys
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
    // tslint:enable:object-literal-sort-keys
  }).sync();

  // const bcrypt = require('bcryptjs');
  // await User.create({
  //   pid: '1234abcd',
  //   username: 'testUser',
  //   passwordHash: bcrypt.hashSync('KrNZYmR2uhWERtgCKrQ8DjBxsIr8yWUkU/4Mi+ePhtM=', 8),
  //   email: 'mail@example.com',
  // });

  logger.info('Model defined: User');
}
