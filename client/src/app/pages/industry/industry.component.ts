import { Component } from '@angular/core';

import { DataPageComponent } from '../data-page/data-page.component';
import { ScopesComponent } from '../scopes/scopes.component';

@Component({
    selector: 'app-industry',
    styleUrls: ['./industry.component.scss'],
    templateUrl: './industry.component.html',
})
export class IndustryComponent extends DataPageComponent {

    constructor() {
        super();
        this.requiredScopes = [
            ScopesComponent.scopeCodes.JOBS,
            ScopesComponent.scopeCodes.BLUEPRINTS,
        ];
    }
}
