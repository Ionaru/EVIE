import { Character } from '../character/character';

export class User {
  pid: string;
  username: string;
  email: string;
  characters: Array<Character> = [];
  selectedAccount: number = 0;

  constructor(data: UserApiData) {
    this.pid = data.pid;
    this.username = data['username'];
    this.email = data['email'];
  }
}
