import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { User } from '../../models/user/user.model';
import { UserService } from '../../models/user/user.service';

@Component({
    styleUrls: ['./register-modal.component.scss'],
    templateUrl: './register-modal.component.html',
})
export class RegisterModalComponent {

    public usernameStatus!: string;
    public usernameHint!: string;

    public emailStatus!: string;
    public emailHint!: string;

    public passwordStatus!: string;
    public passwordHint!: string;
    public passwordInput!: string;

    public password2Status!: string;
    public password2Hint!: string;
    public password2Input!: string;

    public registerError = false;
    public registerErrorMessage = '';

    public inProgress = false;

    constructor(public activeModal: NgbActiveModal, private userService: UserService, private router: Router) {
        this.setupModal();
    }

    public setupModal(): void {
        this.resetUsernameInput();
        this.resetEmailInput();
        this.resetPasswordInput();
        this.resetPassword2Input();
    }

    public resetUsernameInput(): void {
        this.usernameStatus = 'info';
        this.usernameHint = 'Please enter a username for your account.';
    }

    public resetEmailInput(): void {
        this.emailStatus = 'info';
        this.emailHint = 'Please enter your email address.';
    }

    public resetPasswordInput(): void {
        this.passwordStatus = 'info';
        this.passwordHint = 'Do not use your EVE Online password!';
        this.passwordInput = '';
    }

    public resetPassword2Input(): void {
        this.password2Status = 'info';
        this.password2Hint = 'Please confirm your password.';
        this.password2Input = '';
    }

    public anyFormErrors(): boolean {
        return this.usernameStatus === 'error'
            || this.emailStatus === 'error'
            || this.passwordStatus === 'error'
            || this.password2Status === 'error';
    }

    public onUsernameInput(event: any): void {
        this.usernameStatus = '';

        const target = event.target as HTMLInputElement;
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

    public onEmailInput(event: Event): void {
        this.emailStatus = '';

        const target = event.target as HTMLInputElement;
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

    public onPasswordInput() {
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

    public onPassword2Input() {
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

    public async register(formValues: { username: string, email: string, password: string, password2: string }): Promise<void> {
        this.inProgress = true;
        this.registerError = false;

        const result = await this.userService.registerUser(formValues.username, formValues.email, formValues.password);
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
        } else if (result === 'success') {
            const response: [string, User | undefined] = await this.userService.loginUser(formValues.username, formValues.password);
            this.inProgress = false;
            if (response[0] === 'LoggedIn') {
                this.router.navigate(['/dashboard']).then();
            }
            this.activeModal.close();
        }
        this.inProgress = false;
    }
}
