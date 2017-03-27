import { UserModel } from '../models/user/user';
import { CharacterModel } from '../models/character/character';

/**
 * Generate a random string from a range of 62 characters
 * @param {number} length - The length of the desired string
 * @return {string} - The randomly generated string
 */
export function generateRandomString(length: number): string {
  let string = '';
  const possibleCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    string += possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
  }
  return string;
}

/**
 * Generate a random PID that is unique for a given model
 * @param {number} pidLength - The length of the desired PID
 * @param {UserModel | CharacterModel} model - Which model to generate a unique PID for
 * @return {string} - The unique PID
 */
export async function generateUniquePID(pidLength: number, model: UserModel | CharacterModel): Promise<string> {
  const pid = generateRandomString(pidLength);
  const search = await model.findOne(
    {
      attributes: ['id'],
      where: {
        pid: pid
      },
    });
  if (search) {
    return await generateUniquePID(pidLength, model);
  } else {
    return pid;
  }
}
