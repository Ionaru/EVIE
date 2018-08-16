import { Component } from '@angular/core';
import { faTimes } from '@fortawesome/pro-solid-svg-icons';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { UserService } from '../models/user/user.service';

@Component({
    styleUrls: ['./logout-modal.component.scss'],
    templateUrl: './logout-modal.component.html',
})
export class LogoutModalComponent {

    public faTimes = faTimes;

    constructor(public activeModal: NgbActiveModal, private userService: UserService) { }

    public logout = () => this.userService.logoutUser();
}
