import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { Globals } from '../../../shared/globals';
import { Helpers } from '../../../shared/helpers';

@Component({
  styleUrls: ['index.component.scss'],
  templateUrl: 'index.component.html',
})
export class IndexComponent implements OnInit {

  public loggedIn: boolean;

  constructor(private title: Title, private globals: Globals) {
    title.setTitle(Helpers.createTitle('Home'));
  }

  public ngOnInit(): void {
    this.loggedIn = this.globals.loggedIn;
  }
}
