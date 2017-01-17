import { Injectable } from '@angular/core';
import { User } from './components/user/user';
import { Character } from './components/character/character';
import { Observable } from 'rxjs';

@Injectable()
export class Globals {
  get loggedIn(): boolean {
    return this._loggedIn;
  }

  set loggedIn(value: boolean) {
    this._loggedIn = value;
  }

  get socket(): SocketIOClient.Socket {
    return this._socket;
  }

  set socket(value: SocketIOClient.Socket) {
    this._socket = value;
  }

  get user(): User {
    return this._user;
  }

  set user(value: User) {
    this._user = value;
  }

  get isLoggedIn(): Observable<boolean> {
    return this._isLoggedIn;
  }

  set isLoggedIn(value: Observable<boolean>) {
    this._isLoggedIn = value;
  }

  get DOMParser(): DOMParser {
    return this._DOMParser;
  }

  get selectedCharacter(): Character {
    return this._selectedCharacter;
  }

  set selectedCharacter(value: Character) {
    this._selectedCharacter = value;
  }

  private _selectedCharacter: Character;
  private _DOMParser: DOMParser = new DOMParser();
  private _isLoggedIn: Observable<boolean>;
  private _loggedIn: boolean;
  private _user: User;
  private _socket: SocketIOClient.Socket;
}
