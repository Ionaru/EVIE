import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { UserService } from '../../components/user/user.service';
import { User } from '../../components/user/user';
import { Globals } from '../../globals';
import { isEmpty } from '../../components/helperfunctions.component';
import { Router } from '@angular/router';

@Component({
  templateUrl: 'index.component.html',
  styleUrls: ['index.component.scss']
})
export class IndexComponent implements OnInit {

  loggedIn: boolean;

  constructor(title: Title, private userService: UserService, private globals: Globals, private router: Router) {
    title.setTitle('EVE Track - Home');
  }

  ngOnInit(): void {
    this.loggedIn = this.globals.loggedIn;
  }

  loginDebug(): void {
    this.userService.loginUser('testUser', '000999888').subscribe(
      (user: User) => {
        this.loggedIn = true;
        if (user) {
          this.globals.loggedIn = true;
          this.globals.user = user;
          if (isEmpty(user.characters)) {
            this.router.navigate(['/dashboard']).then();
          }
        }
      },
    );
  }

  login(formValues: {username, password}): void {
    this.userService.loginUser(formValues.username, formValues.password).subscribe(
      (response: [string, User]) => {
        if (response[0] === 'LoggedIn') {
          let user = response[1];
          this.loggedIn = true;
          this.globals.loggedIn = true;
          if (isEmpty(user.characters)) {
            this.router.navigate(['/dashboard']).then();
          }
        } else {
          // TODO: Give the user feedback about the failed login.
        }
      },
    );
  }
}
