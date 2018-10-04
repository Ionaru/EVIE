import { Component, OnInit } from '@angular/core';

import { IUsersResponse } from '../../../shared/interface.helper';
import { UsersService } from '../../data-services/users.service';

@Component({
    selector: 'app-users',
    styleUrls: ['./users.component.scss'],
    templateUrl: './users.component.html',
})
export class UsersComponent implements OnInit {

    public users: IUsersResponse[] = [];

    constructor(private usersService: UsersService) { }

    public ngOnInit() {
        this.usersService.getUsers().then((users) => {
            if (users) {
                this.users = users;
            }
        });
    }

}
