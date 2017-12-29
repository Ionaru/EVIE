import { db } from './db.service';

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
 * @param model - Which model to generate a unique PID for, MODEL NEEDS A 'pid' ATTRIBUTE!
 * @return {string} - The unique PID
 */
export async function generateUniquePID(pidLength: number, model: any): Promise<string> {
  const pid = generateRandomString(pidLength);
  // Because of some typing issues, we need to set the model as any.
  const search: any | undefined = await db.orm.getRepository(model).createQueryBuilder('model')
    .select('model.id')
    .where('model.pid = :pid', {pid})
    .getOne();

  if (search) {
    // This PID is already in use, run the function again.
    return await generateUniquePID(pidLength, model);
  }
  return pid;
}
