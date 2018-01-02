import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../models/user/user.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { User } from '../../models/user/user.model';

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
    styleUrls: ['./register-modal.component.scss'],
    templateUrl: './register-modal.component.html',
})
export class RegisterModalComponent {

    public usernameStatus: string;
    public usernameHint: string;

    public emailStatus: string;
    public emailHint: string;

    public passwordStatus: string;
    public passwordHint: string;
    public passwordInput: string;

    public password2Status: string;
    public password2Hint: string;
    public password2Input: string;

    public registerError: boolean;
    public registerErrorMessage: string;

    public inProgress: boolean;

    public isModalShown = false;

    @ViewChild('usernameInput') public usernameInput: ElementRef;

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

    // public showModal(): void {
    //     this.setupModal();
    //     this.isModalShown = true;
    // }
    //
    // public hideModal(): void {
    //     this.autoShownModal.hide();
    // }

    // public onHidden(): void {
    //     this.isModalShown = false;
    // }
    //
    // public onShown(): void {
    //     this.usernameInput.nativeElement.focus();
    // }

    public anyFormErrors(): boolean {
        if (this.usernameStatus === 'error'
            || this.emailStatus === 'error'
            || this.passwordStatus === 'error'
            || this.password2Status === 'error') {
            return true;
        }
    }

    // public getHintLevel(input) {
    //     switch (input) {
    //         case 'error':
    //             return 'fa-times-circle';
    //         case 'info':
    //             return 'fa-info-circle';
    //         case 'valid':
    //             return 'fa-check-circle';
    //     }
    // }

    public getTextColorClass(input) {
        switch (input) {
            case 'error':
                return 'text-danger';
            case 'valid':
                return 'text-success';
        }
    }

    public getHintIconClass(input) {
        switch (input) {
            case 'error':
                return 'fa-times-circle';
            case 'info':
                return 'fa-info-circle';
            case 'valid':
                return 'fa-check-circle';
        }
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
                this.activeModal.close();
            }
        }
    }
}
