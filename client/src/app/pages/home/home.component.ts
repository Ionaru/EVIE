import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Character } from '../../models/character/character.model';
import { User } from '../../models/user/user.model';

import { UserService } from '../../models/user/user.service';
import { LoginModalComponent } from './login-modal.component';
import { RegisterModalComponent } from './register-modal.component';

@Component({
    selector: 'app-home',
    styleUrls: ['./home.component.scss'],
    templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {

    public isLoggedIn = false;

    constructor(private modalService: NgbModal, private userService: UserService) { }

    public ngOnInit() {
        this.isLoggedIn = !!UserService.user;
        UserService.userChangeEvent.subscribe((user) => {
            this.isLoggedIn = !!user;
        });
    }

    public openLoginModal = () => this.modalService.open(LoginModalComponent);

    public openRegisterModal = () => this.modalService.open(RegisterModalComponent);

    public authCharacter() {
        this.userService.ssoLogin();
    }
}
