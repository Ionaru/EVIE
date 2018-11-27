import { Component } from '@angular/core';
import { faEye, faEyeSlash } from '@fortawesome/pro-regular-svg-icons';
import { faChevronDown, faUserPlus } from '@fortawesome/pro-solid-svg-icons';

import { UserService } from '../../models/user/user.service';

@Component({
    selector: 'app-scopes',
    styleUrls: ['./scopes.component.scss'],
    templateUrl: './scopes.component.html',
})
export class ScopesComponent {

    public addCharacterIcon = faUserPlus;

    public viewEnabledIcon = faEye;
    public viewDisabledIcon = faEyeSlash;

    public caretDown = faChevronDown;

    public thing = false;

    constructor(private userService: UserService) { }

    public authCharacter = () => this.userService.authCharacter();
}
