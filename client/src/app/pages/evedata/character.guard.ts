import { Injectable } from '@angular/core';
import { CanActivate, Resolve } from '@angular/router';
// import { UserService } from '../components/user/user.service';
import { Globals } from '../../globals';
import { Observable } from 'rxjs';

@Injectable()
export class CharacterGuard implements Resolve<boolean> {
  constructor(private globals: Globals) {}

  resolve() {
    if (this.globals.selectedCharacter) {
      return Observable.of(true);
    } else {
      return this.globals.isLoggedIn;
    }
  }
}
