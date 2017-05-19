import { Component, ElementRef, ViewChild } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { UserService } from '../../../models/user/user.service';
import { Globals } from '../../../shared/globals';
import { Router } from '@angular/router';
import { User } from '../../../models/user/user.model';
import { environment } from '../../../../environments/environment';
import { animate, state, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'login-modal-button',
  templateUrl: './login-modal.component.html',
  styleUrls: ['./login-modal.component.scss'],
  animations: [
    trigger(
      'myAnimation',
      [
        state('in', style({})),
        transition(
          ':enter', [
            style({opacity: 0}),
            animate('0.3s', style({opacity: 1}))
          ]
        ),
        transition(
          ':leave', [
            style({'opacity': 1}),
            animate('0.3s', style({opacity: 0})),
          ]
        )]
    ),
  ],
})
export class LoginModalComponent {
  @ViewChild('autoShownModal') public autoShownModal: ModalDirective;

  wrongLogin: boolean;
  debugging: boolean;
  inProgress: boolean;

  public isModalShown = false;

  @ViewChild('usernameInput') usernameInput: ElementRef;

  constructor(private userService: UserService, private globals: Globals, private router: Router) {
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

  resetStyle() {
    this.wrongLogin = false;
  }

  loginDebug(): void {
    this.login({username: 'testUser', password: '000999888'}).then();
  }

  async login(formValues: { username: string, password: string }): Promise<void> {
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
