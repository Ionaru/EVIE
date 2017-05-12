import { Component, OnInit, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { UserService } from '../../../models/user/user.service';
import { User } from '../../../models/user/user.model';
import { Globals } from '../../../shared/globals';
import { Helpers } from '../../../shared/helpers';
import { Router } from '@angular/router';
import { ModalDirective } from 'ngx-bootstrap';

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

  register(formValues: { username: string, email: string, password: string, password2: string }): void {
    if (formValues.password === formValues.password2) {
      this.userService.registerUser(formValues.username, formValues.email, formValues.password).then();
    }
  }
}
