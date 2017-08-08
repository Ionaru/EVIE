import Sequelize = require('sequelize');
import Instance = Sequelize.Instance;
import Model = Sequelize.Model;

import { db } from '../../services/db.service';
import { logger } from '../../services/logger.service';
import { userModel } from '../user/user';

export let characterModel;

export interface ICharacterAttr {
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

// tslint:disable:no-empty-interface
export interface ICharacterInstance extends Instance<ICharacterAttr>, ICharacterAttr { }
export interface ICharacterModel extends Model<ICharacterAttr, ICharacterAttr> { }
// tslint:enable:no-unused-variable

export async function defineCharacter(): Promise<void> {
  characterModel = await db.seq.define('characters', {
    // tslint:disable:object-literal-sort-keys
    pid: {
      allowNull: false,
      type: Sequelize.STRING,
      unique: true,
    },
    name: {
      allowNull: true,
      type: Sequelize.STRING,
    },
    characterId: {
      allowNull: true,
      type: Sequelize.INTEGER,
    },
    authToken: {
      allowNull: true,
      type: Sequelize.STRING,
    },
    accessToken: {
      allowNull: true,
      type: Sequelize.STRING,
    },
    tokenExpiry: {
      allowNull: true,
      type: Sequelize.DATE,
    },
    refreshToken: {
      allowNull: true,
      type: Sequelize.STRING,
    },
    scopes: {
      allowNull: true,
      type: Sequelize.STRING,
    },
    ownerHash: {
      allowNull: true,
      type: Sequelize.STRING,
    },
    isActive: {
      allowNull: false,
      defaultValue: false,
      type: Sequelize.BOOLEAN,
    },
    userId: {
      allowNull: false,
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      references: {
        model: userModel,
      },
      type: Sequelize.INTEGER,
    },
    // tslint:enable:object-literal-sort-keys
  }).sync();

  userModel.hasMany(characterModel);

  // await Character.create({
  //   pid: '1234abcd',
  //   name: 'myKey',
  //   keyID: **,
  //   vCode: '***',
  //   userId: 1,
  // });

  logger.info('Model defined: Character');
}
