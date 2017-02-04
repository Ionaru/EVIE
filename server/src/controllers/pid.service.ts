import { UserModel } from '../models/user/user';
import { CharacterModel } from '../models/character/character';

export function generateRandomString(length: number): string {
  let string = '';
  const possibleCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    string += possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
  }
  return string;
}

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
    return generateUniquePID(pidLength, model);
  } else {
    return pid;
  }
}
