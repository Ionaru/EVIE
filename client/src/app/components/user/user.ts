import { Character } from '../character/character';

export class User {
  pid: string;
  username: string;
  email: string;
  characters: Array<Character>;
  selectedAccount: number = 0;

  fillData(dataFromServer: Object): void {
    this.pid = dataFromServer['pid'];
    this.username = dataFromServer['username'];
    this.email = dataFromServer['email'];
    this.characters = dataFromServer['characters'];
  }
}
