import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ModalDirective } from 'ngx-bootstrap/modal';

import { environment } from '../../../../environments/environment';
import { User } from '../../../models/user/user.model';
import { UserService } from '../../../models/user/user.service';

@Component({
  animations: [
    trigger(
      'myAnimation',
      [
        state('in', style({})),
        transition(
          ':enter', [
            style({opacity: 0}),
            animate('0.3s', style({opacity: 1})),
          ],
        ),
        transition(
          ':leave', [
            style({opacity: 1}),
            animate('0.3s', style({opacity: 0})),
          ],
        )],
    ),
  ],
  selector: 'login-modal-button',
  styleUrls: ['./login-modal.component.scss'],
  templateUrl: './login-modal.component.html',
})
export class LoginModalComponent {
  @ViewChild('autoShownModal') public autoShownModal: ModalDirective;

  public wrongLogin: boolean;
  public debugging: boolean;
  public inProgress: boolean;

  public isModalShown = false;

  @ViewChild('usernameInput') public usernameInput: ElementRef;

  constructor(private userService: UserService, private router: Router) {
    if (!environment.production) {
      this.debugging = true;
    }
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

  public onShown(): void {
    this.usernameInput.nativeElement.focus();
  }

  public resetStyle() {
    this.wrongLogin = false;
  }

  public loginDebug(): void {
    this.login({username: 'testUser', password: '000999888'}).then();
  }

  public async login(formValues: { username: string, password: string }): Promise<void> {
    this.inProgress = true;
    const response: [string, User] = await this.userService.loginUser(formValues.username, formValues.password);
    this.inProgress = false;
    if (response[0] === 'LoggedIn') {
      this.router.navigate(['/dashboard']).then();
    } else {
      this.wrongLogin = true;
    }
  }
}
