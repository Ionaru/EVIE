import { Component } from '@angular/core';
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
export class IndexComponent {

  loggedIn: boolean = this.globals.loggedIn;

  constructor(title: Title, private userService: UserService, private globals: Globals, private router: Router) {
    title.setTitle('EVE Track - Home');
    // this.loggedIn = this.globals.loggedIn;
  }

  login(): void {
    this.userService.loginUser().subscribe(
      (user: User) => {
        if (user) {
          this.globals.loggedIn = true;
          // this.loggedIn = true;
          this.globals.user = user;
          // localStorage.setItem('User', JSON.stringify(user));
          // console.log(user);
          // console.log(user.accounts);
          if (!isEmpty(user.characters)) {
            this.globals.selectedCharacter = user.characters[user.selectedAccount];
          } else {
            // User has to add an EVE character
            this.router.navigate(['/dashboard']).then();
          }
        }
      },
    );
  }

  logout(): void {
    this.userService.logoutUser();
  }
}
