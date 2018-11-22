import { Component, OnInit } from '@angular/core';

import { IUsersResponse } from '../../../shared/interface.helper';
import { ITableHeader } from '../../components/sor-table/sor-table.component';
import { UsersService } from '../../data-services/users.service';

@Component({
    selector: 'app-users',
    styleUrls: ['./users.component.scss'],
    templateUrl: './users.component.html',
})
export class UsersComponent implements OnInit {

    public users: IUsersResponse[] = [];

    public tableSettings: ITableHeader[] = [{
        attribute: 'user.id',
        sort: true,
        title: 'ID',
    }, {
        attribute: 'name',
        prefixFunction: (data) => `<img src="//imageserver.eveonline.com/Character/${data.characterId}_32.jpg" alt="${data.name}"> `,
        sort: true,
        title: 'Name',
    }, {
        attribute: 'characterId',
        sort: true,
        title: 'Character ID',
    }, {
        attribute: 'user.timesLogin',
        sort: true,
        title: 'Times logged in',
    }, {
        attribute: 'user.lastLogin',
        pipe: 'date',
        pipeVar: 'yyyy-MM-dd HH:mm:ss',
        sort: true,
        title: 'Last login',
    }];

    constructor(private usersService: UsersService) { }

    public ngOnInit() {
        this.usersService.getUsers().then((users) => {
            if (users) {
                this.users = users;
            }
        });
    }
}
