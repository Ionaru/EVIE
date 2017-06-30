import { Component, ElementRef, ViewChild } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { UserService } from '../../../models/user/user.service';
import { Router } from '@angular/router';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { User } from '../../../models/user/user.model';

@Component({
  selector: 'register-modal-button',
  templateUrl: './register-modal.component.html',
  styleUrls: ['./register-modal.component.scss'],
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
export class RegisterModalComponent {
  @ViewChild('autoShownModal') public autoShownModal: ModalDirective;

  usernameStatus: string;
  usernameHint: string;

  emailStatus: string;
  emailHint: string;

  passwordStatus: string;
  passwordHint: string;
  passwordInput: string;

  password2Status: string;
  password2Hint: string;
  password2Input: string;

  registerError: boolean;
  registerErrorMessage: string;

  inProgress: boolean;

  public isModalShown = false;

  @ViewChild('usernameInput') usernameInput: ElementRef;

  constructor(private userService: UserService, private router: Router) { }

  setupModal(): void {
    this.resetUsernameInput();
    this.resetEmailInput();
    this.resetPasswordInput();
    this.resetPassword2Input();
  }

  resetUsernameInput(): void {
    this.usernameStatus = 'info';
    this.usernameHint = 'Please enter a username for your account.';
  }

  resetEmailInput(): void {
    this.emailStatus = 'info';
    this.emailHint = 'Please enter your email address.';
  }

  resetPasswordInput(): void {
    this.passwordStatus = 'info';
    this.passwordHint = 'Do not use your EVE Online password!';
    this.passwordInput = '';
  }

  resetPassword2Input(): void {
    this.password2Status = 'info';
    this.password2Hint = 'Please confirm your password.';
    this.password2Input = '';
  }

  public showModal(): void {
    this.setupModal();
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

  anyFormErrors(): boolean {
    if (this.usernameStatus === 'error'
      || this.emailStatus === 'error'
      || this.passwordStatus === 'error'
      || this.password2Status === 'error') {
      return true;
    }
  }

  getTextColorClass(input) {
    switch (input) {
      case 'error':
        return 'text-danger';
      case 'valid':
        return 'text-success';
    }
  }

  getHintIconClass(input) {
    switch (input) {
      case 'error':
        return 'fa-times-circle';
      case 'info':
        return 'fa-info-circle';
      case 'valid':
        return 'fa-check-circle';
    }
  }

  onUsernameInput(event: any): void {
    this.usernameStatus = '';

    const target = <HTMLInputElement> event.target;
    const text: string = target.value;

    if (text.trim().length < 1) {
      this.resetUsernameInput();
    } else if (text.trim().length < 2) {
      this.usernameHint = 'Please create a username with 2 characters or more';
      this.usernameStatus = 'error';
    } else if (text.trim().length > 250) {
      this.usernameHint = 'Please limit your username to 250 characters or less';
      this.usernameStatus = 'error';
    } else if (new RegExp(/^\s/).test(text) || new RegExp(/\s$/).test(text)) {
      this.usernameHint = 'Spaces at the start and end of the input will be removed';
      this.usernameStatus = 'info';
    } else {
      this.usernameHint = 'Input validated';
      this.usernameStatus = 'valid';
    }
  }

  onEmailInput(event: Event): void {
    this.emailStatus = '';

    const target = <HTMLInputElement> event.target;
    const text = target.value;

    if (text.trim().length < 1) {
      this.resetEmailInput();
    } else if (text.indexOf('@') === -1 || text.indexOf('.') === -1) {
      this.emailHint = 'That does not look like a valid email address';
      this.emailStatus = 'info';
    } else if (text.trim().length > 250) {
      this.emailHint = 'Please limit your input to 250 or less characters';
      this.emailStatus = 'error';
    } else if (new RegExp(/^\s/).test(text) || new RegExp(/\s$/).test(text)) {
      this.emailHint = 'Spaces at the start and end of the input will be removed';
      this.emailStatus = 'info';
    } else {
      this.emailHint = 'Input validated';
      this.emailStatus = 'valid';
    }
  }

  onPasswordInput() {
    this.passwordStatus = '';

    const text = this.passwordInput;

    if (text.trim().length < 1) {
      this.resetPasswordInput();
    } else if (text.trim().length < 12) {
      this.passwordHint = 'A strong password is longer than 12 characters';
      this.passwordStatus = 'info';
    } else {
      this.passwordHint = 'Input validated';
      this.passwordStatus = 'valid';
    }
  }

  onPassword2Input() {
    this.password2Status = '';

    const text = this.password2Input;

    if (text.trim().length < 1) {
      this.resetPassword2Input();
    } else if (text !== this.passwordInput) {
      this.password2Hint = 'Passwords didn\'t match!';
      this.password2Status = 'error';
    } else {
      this.password2Hint = 'Input validated';
      this.password2Status = 'valid';
    }
  }

  async register(formValues: { username: string, email: string, password: string, password2: string }): Promise<void> {
    this.inProgress = true;
    this.registerError = false;

    const result = await this.userService.registerUser(formValues.username, formValues.email, formValues.password);
    this.inProgress = false;
    if (result === 'username_in_use') {
      this.registerError = true;
      this.registerErrorMessage = this.usernameHint = 'That username is already in use.';
      this.usernameStatus = 'error';
    } else if (result === 'email_in_use') {
      this.registerError = true;
      this.registerErrorMessage = this.emailHint = 'That email is already in use.';
      this.emailStatus = 'error';
    } else if (result === 'error') {
      this.registerError = true;
      this.registerErrorMessage = 'An unknown error occurred.';
    } else {
      const response: [string, User] = await this.userService.loginUser(formValues.username, formValues.password);
      this.inProgress = false;
      if (response[0] === 'LoggedIn') {
        this.router.navigate(['/dashboard']).then();
      } else {
        this.hideModal();
      }
    }
  }
}
