import { Injectable } from '@angular/core';
import { Account } from './components/account/account';
import { Character } from './components/character/character';
import { Observable } from 'rxjs';

@Injectable()
export class Globals {
  get isLoggedIn(): Observable<boolean> {
    return this._isLoggedIn;
  }

  set isLoggedIn(value: Observable<boolean>) {
    this._isLoggedIn = value;
  }

  get DOMParser(): DOMParser {
    return this._DOMParser;
  }

  get activeAccount(): Account {
    return this._activeAccount;
  }

  set activeAccount(value: Account) {
    this._activeAccount = value;
  }

  get selectedCharacter(): Character {
    return this._selectedCharacter;
  }

  set selectedCharacter(value: Character) {
    this._selectedCharacter = value;
  }
  private _activeAccount: Account;
  private _selectedCharacter: Character;
  private _DOMParser: DOMParser = new DOMParser();
  private _isLoggedIn: Observable<boolean>;
}
