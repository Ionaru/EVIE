import Sequelize = require('sequelize');
import Instance = Sequelize.Instance;
import Model = Sequelize.Model;

import { db } from '../../controllers/db.service';
import { logger } from '../../controllers/logger.service';
import { User } from '../user/user';

export let Character;

export interface CharacterAttr {
  id: number;
  pid: string;
  name: string;
  characterId: number;
  authToken: string;
  accessToken: string;
  tokenExpiry: Date;
  refreshToken: string;
  scopes: string;
  ownerHash: string;
  isActive: boolean;
  userId: number;
}

/* tslint:disable:no-empty-interface */
export interface CharacterInstance extends Instance<CharacterAttr>, CharacterAttr { }
export interface CharacterModel extends Model<CharacterAttr, CharacterAttr> { }
/* tslint:enable:no-unused-variable */

export async function defineCharacter(): Promise<void> {
  Character = await db.seq.define('characters', {
    pid: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    characterId: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    authToken: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    accessToken: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    tokenExpiry: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    refreshToken: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    scopes: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    ownerHash: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    isActive: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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

  User.hasMany(Character);

  // await Character.create({
  //   pid: '1234abcd',
  //   name: 'myKey',
  //   keyID: **,
  //   vCode: '***',
  //   userId: 1,
  // });

  logger.info('Model defined: Character');
}
