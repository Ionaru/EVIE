import { Component } from '@angular/core';
import { faEye, faEyeSlash } from '@fortawesome/pro-regular-svg-icons';
import { faChevronDown, faChevronUp, faUserPlus } from '@fortawesome/pro-solid-svg-icons';

import { UserService } from '../../models/user/user.service';

@Component({
    selector: 'app-scopes',
    styleUrls: ['./scopes.component.scss'],
    templateUrl: './scopes.component.html',
})
export class ScopesComponent {

    // Icons
    public addCharacterIcon = faUserPlus;
    public viewEnabledIcon = faEye;
    public viewDisabledIcon = faEyeSlash;
    public caretDown = faChevronDown;
    public caretUp = faChevronUp;

    // Angular variables
    public readSkillsInfo = false;
    public readSkillsScope = 'esi-skills.read_skills.v1';

    public thing = false;

    constructor(private userService: UserService) { }

    public authCharacter = () => this.userService.authCharacter();
}
