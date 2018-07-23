import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { UserService } from '../models/user/user.service';

@Component({
    styleUrls: ['./logout-modal.component.scss'],
    templateUrl: './logout-modal.component.html',
})
export class LogoutModalComponent {

    constructor(public activeModal: NgbActiveModal, private userService: UserService) { }

    public logout(): void {
        this.userService.logoutUser();
    }
}
