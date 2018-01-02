import { Component, OnInit } from '@angular/core';
import { UserService } from '../../models/user/user.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LoginModalComponent } from './login-modal.component';
import { RegisterModalComponent } from './register-modal.component';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

    isLoggedIn: boolean;

    constructor(private modalService: NgbModal) { }

    ngOnInit() {
        this.isLoggedIn = !!UserService.user;
        UserService.userChangeEvent.subscribe((user) => {
            this.isLoggedIn = !!user;
        });
    }

    openLoginModal() {
        this.modalService.open(LoginModalComponent);
    }

    openRegisterModal() {
        this.modalService.open(RegisterModalComponent);
    }

}
