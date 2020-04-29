import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { UserService } from '../../models/user/user.service';
import { createTitle } from '../../shared/title';

@Component({
    selector: 'app-home',
    styleUrls: ['./home.component.scss'],
    templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {

    public isLoggedIn = false;

    constructor(private title: Title, private userService: UserService) { }

    public ngOnInit() {
        this.title.setTitle(createTitle('Home'));
        this.isLoggedIn = !!UserService.user;
        UserService.userChangeEvent.subscribe((user) => {
            this.isLoggedIn = !!user;
        });
    }

    public authCharacter() {
        this.userService.ssoLogin();
    }
}
