import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable } from 'rxjs';

import { Globals } from '../../shared/globals';

@Injectable()
export class CharacterGuard implements Resolve<boolean> {
  constructor(private globals: Globals) {}

  public resolve(): Observable<boolean> {
    if (this.globals.user) {
      return Observable.of(true);
    } else {
      return this.globals.startUpObservable;
    }
  }
}
