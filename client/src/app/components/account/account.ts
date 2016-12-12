import { Character } from '../character/character';

export class Account {
  id: number;
  name: string;
  keyID: number;
  vCode: string;
  paidUntil: Date;
  createDate: Date;
  logonCount: number;
  logonMinutes: number;
  characters: Array<Character> = [];
  maximumCharacters: number = 3;
  accessMask: number = 0;

  constructor(name: string, keyID: number, vCode: string) {
    this.name = name;
    this.keyID = keyID;
    this.vCode = vCode;
  }

  public addCharacter(character: Character): void {
    if (this.characters.length < this.maximumCharacters) {
      this.characters.push(character);
    } else {
      throw new Error('Account cannot have more than ' + this.maximumCharacters + ' characters!');
    }
  }
}
