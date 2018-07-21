import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

import { Character } from '../models/character/character.model';
import { User } from '../models/user/user.model';
import { INames } from '../services/names.service';

@Injectable()
export class Globals {
  get userChangeEvent(): Subject<User> {
    return this._userChangeEvent;
  }

  get characterChangeEvent(): Subject<Character> {
    return this._characterChangeEvent;
  }

  get startUpObservable(): Observable<boolean> {
    return this._startUpObservable;
  }

  set startUpObservable(value: Observable<boolean>) {
    this._startUpObservable = value;
  }

  get startUp(): boolean {
    return this._startUp;
  }

  set startUp(value: boolean) {
    this._startUp = value;
  }

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

  get selectedCharacter(): Character {
    return this._selectedCharacter;
  }

  set selectedCharacter(value: Character) {
    this._selectedCharacter = value;
  }

  public names: INames;
  public namesExpiry: number;
  private _selectedCharacter: Character;
  private _loggedIn = false;
  private _user: User;
  private _socket: SocketIOClient.Socket;
  private _startUp = false;
  private _startUpObservable: Observable<boolean>;
  private _characterChangeEvent: Subject<Character> = new Subject<Character>();
  private _userChangeEvent: Subject<User> = new Subject<User>();

}
