import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable } from 'rxjs';

import { Globals } from '../../shared/globals';

@Injectable()
export class AppGuard implements Resolve<boolean> {
  constructor(private globals: Globals) {}

  public resolve(): Observable<boolean> {
    if (this.globals.startUp) {
      return Observable.of(true);
    } else {
      return this.globals.startUpObservable;
    }
  }
}
