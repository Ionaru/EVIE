import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { environment } from '../../../environments/environment';
import { User } from '../../models/user/user.model';
import { UserService } from '../../models/user/user.service';

@Component({
    styleUrls: ['./login-modal.component.scss'],
    templateUrl: './login-modal.component.html',
})
export class LoginModalComponent {

    public wrongLogin = false;
    public debugging = false;
    public inProgress = false;

    constructor(public activeModal: NgbActiveModal, private userService: UserService, private router: Router) {
        if (!environment.production) {
            this.debugging = true;
        }
    }

    public loginDebug = () => this.login({username: 'testUser', password: '000999888'}).then();

    public resetStyle() {
        this.wrongLogin = false;
    }

    public async login(formValues: { username: string, password: string }): Promise<void> {
        this.inProgress = true;
        const response: [string, User | undefined] = await this.userService.loginUser(formValues.username, formValues.password);
        this.inProgress = false;
        if (response[0] === 'LoggedIn') {
            this.router.navigate(['/dashboard']).then();
            this.activeModal.close();
        } else {
            this.wrongLogin = true;
        }
    }
}
