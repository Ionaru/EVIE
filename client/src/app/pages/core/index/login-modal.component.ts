import { Component, ViewChild } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { Title } from '@angular/platform-browser';
import { UserService } from '../../../models/user/user.service';
import { Globals } from '../../../shared/globals';
import { Router } from '@angular/router';
import { Helpers } from '../../../shared/helpers';
import { User } from '../../../models/user/user.model';

@Component({
  selector: 'login-modal',
  templateUrl: './login-modal.component.html'
})
export class LoginModalComponent {
  @ViewChild('autoShownModal') public autoShownModal: ModalDirective;

  wrongLogin;

  public isModalShown = false;

  constructor(private title: Title, private userService: UserService, private globals: Globals,
              private router: Router, private helpers: Helpers) {

  }

  public showModal(): void {
    this.isModalShown = true;
  }

  public hideModal(): void {
    this.autoShownModal.hide();
  }

  public onHidden(): void {
    this.isModalShown = false;
  }

  getStyle() {
    if (this.wrongLogin) {
      return 'red';
    } else {
      return 'inherit';
    }
  }

  resetStyle() {
    this.wrongLogin = false;
  }

  loginDebug(): void {
    this.login({username: 'testUser', password: '000999888'}).then();
  }

  async login(formValues: { username: string, password: string }): Promise<void> {
    const response: [string, User] = await this.userService.loginUser(formValues.username, formValues.password);
    if (response[0] === 'LoggedIn') {
      const user = response[1];
      // this.loggedIn = true;
      this.globals.loggedIn = true;
      // if (this.helpers.isEmpty(user.characters)) {
      this.router.navigate(['/dashboard']).then();
      // }
    } else {
      this.wrongLogin = true;
      // TODO: Give the user feedback about the failed login.
    }
  }
}
