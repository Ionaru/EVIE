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

  login(): void {
    this.userService.loginUser().subscribe(
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
}
