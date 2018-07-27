import { Component, OnInit } from '@angular/core';

import { DataPageComponent } from '../data-page/data-page.component';

@Component({
    selector: 'app-industry',
    styleUrls: ['./industry.component.scss'],
    templateUrl: './industry.component.html',
})
export class IndustryComponent extends DataPageComponent implements OnInit {

    constructor() {
        super();
    }

    public ngOnInit() {
        super.ngOnInit();
    }

}
