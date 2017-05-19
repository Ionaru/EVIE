import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { UserService } from '../../../models/user/user.service';
import { Globals } from '../../../shared/globals';
import { Helpers } from '../../../shared/helpers';
import { Router } from '@angular/router';

@Component({
  templateUrl: 'index.component.html',
  styleUrls: ['index.component.scss']
})
export class IndexComponent implements OnInit {

  wrongLogin;
  loggedIn: boolean;

  constructor(private title: Title, private userService: UserService, private globals: Globals,
              private router: Router, private helpers: Helpers) {
    title.setTitle('EVE Track - Home');
  }

  ngOnInit(): void {
    this.loggedIn = this.globals.loggedIn;
  }
}
