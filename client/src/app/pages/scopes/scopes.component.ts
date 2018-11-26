import { Component } from '@angular/core';
import { faUserPlus } from '@fortawesome/pro-solid-svg-icons';
import { UserService } from '../../models/user/user.service';
import { faEye, faEyeSlash } from '@fortawesome/pro-regular-svg-icons';

@Component({
    selector: 'app-scopes',
    styleUrls: ['./scopes.component.scss'],
    templateUrl: './scopes.component.html',
})
export class ScopesComponent {

    public addCharacterIcon = faUserPlus;

    public viewEnabledIcon = faEye;
    public viewDisabledIcon = faEyeSlash;

    constructor(private userService: UserService) { }

    public authCharacter = () => this.userService.authCharacter();
}
