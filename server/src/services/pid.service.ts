import { ICharacterModel } from '../models/character/character';
import { IUserModel } from '../models/user/user';

/**
 * Generate a random string from a range of 62 characters
 * @param {number} length - The length of the desired string
 * @return {string} - The randomly generated string
 */
export function generateRandomString(length: number): string {
  let output = '';
  const possibleCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    output += possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
  }
  return output;
}

/**
 * Generate a random PID that is unique for a given model
 * @param {number} pidLength - The length of the desired PID
 * @param {IUserModel | ICharacterModel} model - Which model to generate a unique PID for
 * @return {string} - The unique PID
 */
export async function generateUniquePID(pidLength: number, model: IUserModel | ICharacterModel): Promise<string> {
  const pid = generateRandomString(pidLength);
  const search = await model.findOne(
    {
      attributes: ['id'],
      where: {
        pid,
      },
    });
  if (search) {
    return await generateUniquePID(pidLength, model);
  } else {
    return pid;
  }
}
