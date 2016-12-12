import Sequelize = require('sequelize');

import { db } from '../../controllers/db.service';
import { logger } from '../../controllers/logger.service';

export let User;

export async function defineUser() {
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
