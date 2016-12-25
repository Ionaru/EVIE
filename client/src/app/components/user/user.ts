import { Character } from '../character/character';

export class User {
  username: string;
  email: string;
  characters: Array<Character>;
  selectedAccount: number = 0;

  fillData(dataFromServer: Object): void {
    this.username = dataFromServer['username'];
    this.email = dataFromServer['email'];
    this.characters = dataFromServer['characters'];
  }
}
