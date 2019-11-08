/* tslint:disable:no-duplicate-string */
import { Component, OnInit } from '@angular/core';
import { faEye, faEyeSlash } from '@fortawesome/pro-regular-svg-icons';
import { faChevronDown, faChevronUp, faUserPlus } from '@fortawesome/pro-solid-svg-icons';

import { CharacterService } from '../../models/character/character.service';
import { UserService } from '../../models/user/user.service';
import { DataPageComponent } from '../data-page/data-page.component';

export enum Scope {
    ASSETS = 'esi-assets.read_assets.v1',
    BLUEPRINTS = 'esi-characters.read_blueprints.v1',
    JOBS = 'esi-industry.read_character_jobs.v1',
    // LOCATION = 'esi-location.read_location.v1',
    // MAIL_ORGANIZE = 'esi-mail.organize_mail.v1',
    MAIL_READ = 'esi-mail.read_mail.v1',
    // MAIL_SEND = 'esi-mail.send_mail.v1',
    ORDERS = 'esi-markets.read_character_orders.v1',
    SHIP_TYPE = 'esi-location.read_ship_type.v1',
    SKILLQUEUE = 'esi-skills.read_skillqueue.v1',
    SKILLS = 'esi-skills.read_skills.v1',
    STRUCTURES = 'esi-universe.read_structures.v1',
    WALLET = 'esi-wallet.read_character_wallet.v1',
}

interface IScopeInfo {
    code: Scope;
    enabled?: boolean;
    eveDescription: string;
    infoVisible?: boolean;
    name: string;
    usageDescription: string;
    usagePages: string[];
}

@Component({
    selector: 'app-scopes',
    styleUrls: ['./scopes.component.scss'],
    templateUrl: './scopes.component.html',
})
export class ScopesComponent extends DataPageComponent implements OnInit {

    // Icons
    public addCharacterIcon = faUserPlus;
    public viewEnabledIcon = faEye;
    public viewDisabledIcon = faEyeSlash;
    public caretDown = faChevronDown;
    public caretUp = faChevronUp;

    public scopes: IScopeInfo[] = [
        {
            code: Scope.SKILLS,
            eveDescription: 'Allows reading of a character\'s currently known skills.',
            name: 'Read skills',
            usageDescription: 'EVIE uses this scope heavily on the Skills page, the skills page does not work without this scope.',
            usagePages: ['skills'],
        },
        {
            code: Scope.SKILLQUEUE,
            eveDescription: 'Allows reading of a character\'s currently training skill queue.',
            name: 'Read skillqueue',
            usageDescription: 'EVIE uses this scope on the Dashboard and Skills pages.',
            usagePages: ['skills'],
        },
        {
            code: Scope.WALLET,
            eveDescription: 'Allows reading of a character\'s wallet, journal and transaction history.',
            name: 'Read wallet balance',
            usageDescription: 'EVIE uses this scope on the Dashboard and Wallet pages.',
            usagePages: ['wallet'],
        },
        {
            code: Scope.ORDERS,
            eveDescription: 'Allows reading a character\'s market orders.',
            name: 'Read market orders',
            usageDescription: 'EVIE uses this scope on the Wallet page.',
            usagePages: ['wallet'],
        },
        {
            code: Scope.MAIL_READ,
            eveDescription: 'Allows reading of the character\'s inbox and mails.',
            name: 'Read mail',
            usageDescription: 'EVIE uses this scope on the Mail page.',
            usagePages: ['evemail'],
        },
        {
            code: Scope.ASSETS,
            eveDescription: 'Allows reading of a character\'s assets.',
            name: 'Read assets',
            usageDescription: 'EVIE uses this scope heavily on the assets page.',
            usagePages: ['assets'],
        },
        {
            code: Scope.BLUEPRINTS,
            eveDescription: 'Allows reading a character\'s blueprints.',
            name: 'Read blueprints',
            usageDescription: 'EVIE uses this scope on the Industry and assets pages.',
            usagePages: ['industry'],
        },
        {
            code: Scope.JOBS,
            eveDescription: 'Allows reading a character\'s industry jobs.',
            name: 'Read industry jobs',
            usageDescription: 'EVIE uses this scope on the Industry page.',
            usagePages: ['industry'],
        },
        {
            code: Scope.STRUCTURES,
            eveDescription: 'Allows querying the location and type of structures that the character has docking access at.',
            name: 'Read structures',
            usageDescription: 'EVIE uses this scope on the Industry page.',
            usagePages: ['industry'],
        },
        {
            code: Scope.SHIP_TYPE,
            eveDescription: 'Allows reading of a character\'s active ship class.',
            name: 'Read current ship type',
            usageDescription: 'EVIE uses this scope on the Dashboard page.',
            usagePages: [],
        },
        // {
        //     code: Scope.LOCATION,
        //     eveDescription: 'Allows reading of a character\'s active ship location.',
        //     name: 'Read current location',
        //     usageDescription: 'EVIE uses this scope on the Skills page.',
        //     usagePages: [],
        // },
    ];

    constructor(private userService: UserService) {
        super();
    }

    public ngOnInit() {
        super.ngOnInit();
        if (CharacterService.selectedCharacter) {
            for (const scope of this.scopes) {
                scope.enabled = CharacterService.selectedCharacter.scopes.includes(scope.code);
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
