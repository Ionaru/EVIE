import { Injectable } from '@angular/core';
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

  get selectedCharacter(): Character {
    return this._selectedCharacter;
  }

  set selectedCharacter(value: Character) {
    this._selectedCharacter = value;
  }
  private _selectedCharacter: Character;
  private _DOMParser: DOMParser = new DOMParser();
  private _isLoggedIn: Observable<boolean>;
}
