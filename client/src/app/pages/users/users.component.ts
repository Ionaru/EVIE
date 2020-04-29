import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { ITableHeader } from '../../components/sor-table/sor-table.component';
import { UsersService } from '../../data-services/users.service';
import { createTitle } from '../../shared/title';

interface IUserData {
    id: number;
    name: string;
    characterId: number;
    timesLogin: number;
    lastLogin: Date;
}

@Component({
    selector: 'app-users',
    styleUrls: ['./users.component.scss'],
    templateUrl: './users.component.html',
})
export class UsersComponent implements OnInit {

    public users: IUserData[] = [];

    public tableSettings: ITableHeader<IUserData>[] = [{
        attribute: 'id',
        sort: true,
        title: 'User ID',
    }, {
        attribute: 'name',
        prefixFunction: (data) => `<img src="https://images.evetech.net/characters/${data.characterId}/portrait?size=32" alt="${data.name}"> `,
        sort: true,
    }, {
        attribute: 'characterId',
        sort: true,
        title: 'Character ID',
    }, {
        attribute: 'timesLogin',
        sort: true,
        title: 'Times logged in',
    }, {
        attribute: 'lastLogin',
        pipe: 'date',
        pipeVar: 'yyyy-MM-dd HH:mm:ss',
        sort: true,
        title: 'Last login',
    }];

    constructor(private usersService: UsersService, private title: Title) { }

    public ngOnInit() {
        this.title.setTitle(createTitle('Users'));
        this.usersService.getUsers().then((users) => {
            if (users) {
                this.users = users.map((user) => {
                    return {
                        id: user.user.id,
                        name: user.name,
                        characterId: user.characterId,
                        timesLogin: user.user.timesLogin,
                        lastLogin: user.user.lastLogin,
                    };
                });
            }
        });
    }
}
