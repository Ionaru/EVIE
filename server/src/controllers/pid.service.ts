import { UserModel } from '../models/user/user';
import { CharacterModel } from '../models/character/character';

export function generatePID(pidLength: number): string {
  let pid = '';
  let possibleCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < pidLength; i++) {
    pid += possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
  }
  return pid;
}

export async function generateUniquePID(pidLength: number, model: UserModel | CharacterModel): Promise<string> {
  let pid = generatePID(pidLength);
  let search = await model.findOne(
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
