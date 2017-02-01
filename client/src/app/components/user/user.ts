import { Character } from '../character/character';

export class User {
  pid: string;
  username: string;
  email: string;
  characters: Array<Character> = [];

  constructor(data: UserApiData) {
    this.pid = data.pid;
    this.username = data['username'];
    this.email = data['email'];
  }
}
