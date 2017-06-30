import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Globals } from '../../../shared/globals';
import { Helpers } from '../../../shared/helpers';

@Component({
  templateUrl: 'index.component.html',
  styleUrls: ['index.component.scss']
})
export class IndexComponent implements OnInit {

  wrongLogin;
  loggedIn: boolean;

  constructor(private title: Title, private globals: Globals) {
    title.setTitle(Helpers.createTitle('Home'));
  }

  ngOnInit(): void {
    this.loggedIn = this.globals.loggedIn;
  }
}
