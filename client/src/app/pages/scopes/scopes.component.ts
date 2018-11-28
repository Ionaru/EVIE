import { Component } from '@angular/core';
import { faEye, faEyeSlash } from '@fortawesome/pro-regular-svg-icons';
import { faChevronDown, faChevronUp, faUserPlus } from '@fortawesome/pro-solid-svg-icons';

import { CharacterService } from '../../models/character/character.service';
import { UserService } from '../../models/user/user.service';

@Component({
    selector: 'app-scopes',
    styleUrls: ['./scopes.component.scss'],
    templateUrl: './scopes.component.html',
})
export class ScopesComponent {

    public static readonly scopeCodes = {
        JOBS: 'esi-industry.read_character_jobs.v1',
        LOCATION: 'esi-location.read_location.v1',
        ORDERS: 'esi-markets.read_character_orders.v1',
        SHIP_TYPE: 'esi-location.read_ship_type.v1',
        SKILLQUEUE: 'esi-skills.read_skillqueue.v1',
        SKILLS: 'esi-skills.read_skills.v1',
        WALLET: 'esi-wallet.read_character_wallet.v1',
    };

    // Icons
    public addCharacterIcon = faUserPlus;
    public viewEnabledIcon = faEye;
    public viewDisabledIcon = faEyeSlash;
    public caretDown = faChevronDown;
    public caretUp = faChevronUp;

    public scopes = [
        {
            code: ScopesComponent.scopeCodes.SKILLS,
            enabled: false,
            eveDescription: 'Allows reading of a character\'s currently known skills.',
            evieDescription: 'This scope will give EVIE read access to your character\'s list of skills, ' +
                'but also the amount of skillpoints and attribute levels.',
            infoVisible: false,
            name: 'Read skills',
            usageDescription: 'EVIE uses this scope heavily on the Skills page.',
            usagePages: ['skills'],
        },
        {
            code: ScopesComponent.scopeCodes.SKILLQUEUE,
            enabled: false,
            eveDescription: 'Allows reading of a character\'s currently training skill queue.',
            evieDescription: 'This scope will give EVIE read access to your character\'s list of skills, ' +
                'but also the amount of skillpoints and attribute levels.',
            infoVisible: false,
            name: 'Read skillqueue',
            usageDescription: 'EVIE uses this scope on the Skills page.',
            usagePages: ['charactersheet', 'skills'],
        },
        {
            code: ScopesComponent.scopeCodes.WALLET,
            enabled: false,
            eveDescription: 'Allows reading of a character\'s wallet, journal and transaction history.',
            evieDescription: 'This scope will give EVIE read access to your character\'s list of skills, ' +
                'but also the amount of skillpoints and attribute levels.',
            infoVisible: false,
            name: 'Read wallet balance',
            usageDescription: 'EVIE uses this scope on the Skills page.',
            usagePages: ['charactersheet', 'wallet'],
        },
        {
            code: ScopesComponent.scopeCodes.ORDERS,
            enabled: false,
            eveDescription: 'Allows reading a character\'s market orders.',
            evieDescription: 'This scope will give EVIE read access to your character\'s list of skills, ' +
                'but also the amount of skillpoints and attribute levels.',
            infoVisible: false,
            name: 'Read market orders',
            usageDescription: 'EVIE uses this scope on the Skills page.',
            usagePages: ['wallet'],
        },
        {
            code: ScopesComponent.scopeCodes.JOBS,
            enabled: false,
            eveDescription: 'Allows reading a character\'s industry jobs.',
            evieDescription: 'This scope will give EVIE read access to your character\'s list of skills, ' +
                'but also the amount of skillpoints and attribute levels.',
            infoVisible: false,
            name: 'Read industry jobs',
            usageDescription: 'EVIE uses this scope on the Skills page.',
            usagePages: ['industry'],
        },
        {
            code: ScopesComponent.scopeCodes.SHIP_TYPE,
            enabled: false,
            eveDescription: 'Allows reading of a character\'s active ship class.',
            evieDescription: 'This scope will give EVIE read access to your character\'s list of skills, ' +
                'but also the amount of skillpoints and attribute levels.',
            infoVisible: false,
            name: 'Read current ship type',
            usageDescription: 'EVIE uses this scope on the Skills page.',
            usagePages: ['charactersheet'],
        },
        {
            code: ScopesComponent.scopeCodes.LOCATION,
            enabled: false,
            eveDescription: 'Allows reading of a character\'s active ship location.',
            evieDescription: 'This scope will give EVIE read access to your character\'s list of skills, ' +
                'but also the amount of skillpoints and attribute levels.',
            infoVisible: false,
            name: 'Read current location',
            usageDescription: 'EVIE uses this scope on the Skills page.',
            usagePages: [],
        },
    ];

    constructor(private userService: UserService) {
        if (CharacterService.selectedCharacter) {
            for (const scope of this.scopes) {
                if (CharacterService.selectedCharacter.scopes.includes(scope.code)) {
                    scope.enabled = true;
                }
            }
        }
    }

    public get allComponentsEnabled(): boolean {
        return this.scopes.every((scope) => scope.enabled);
    }

    public set allComponentsEnabled(value) {
        this.scopes.forEach((scope) => scope.enabled = value);
    }

    public authCharacter() {
        const enabledScopes = this.scopes.filter((scope) => scope.enabled);
        const scopeCodes = enabledScopes.map((scope) => scope.code);
        this.userService.authCharacter(scopeCodes);
    }
}
