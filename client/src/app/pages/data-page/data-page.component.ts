import { Component, OnDestroy, OnInit } from '@angular/core';
import * as countdown from 'countdown';
import { Subscription } from 'rxjs';

import { CharacterService } from '../../models/character/character.service';
import { UserService } from '../../models/user/user.service';
import { NavigationComponent } from '../../navigation/navigation.component';

@Component({
    selector: 'app-base-page',
    template: '',
})
export class DataPageComponent implements OnInit, OnDestroy {

    public missingAllRequiredScopes?: boolean;

    protected requiredScopes: string[] = [];

    private characterChangeSubscription: Subscription;
    private userChangeSubscription: Subscription;
    private serverStatusSubscription: Subscription;

    constructor() {
        this.userChangeSubscription = UserService.userChangeEvent.subscribe(() => {
            this.ngOnInit();
        });
        this.characterChangeSubscription = CharacterService.characterChangeEvent.subscribe(() => {
            this.ngOnInit();
        });
        this.serverStatusSubscription = NavigationComponent.serverStatusEvent.subscribe(() => {
            this.ngOnInit();
        });

        countdown.resetLabels();
        countdown.resetFormat();
    }

    public ngOnInit() {
        this.checkScopes();
    }

    public ngOnDestroy() {
        this.userChangeSubscription.unsubscribe();
        this.characterChangeSubscription.unsubscribe();
        this.serverStatusSubscription.unsubscribe();
    }

    public softReload() {
        this.ngOnInit();
        this.ngOnDestroy();
    }

    private checkScopes() {
        this.missingAllRequiredScopes = !this.requiredScopes.some((scope) => {
            if (CharacterService.selectedCharacter) {
                return CharacterService.selectedCharacter.hasScope(scope);
            }
            return false;
        });
    }
}
