import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { createTitle } from '../../shared/title';

@Component({
    selector: 'app-about',
    styleUrls: ['./about.component.scss'],
    templateUrl: './about.component.html',
})
export class AboutComponent implements OnInit {

    constructor(private title: Title) {
    }

    public ngOnInit(): void {
        this.title.setTitle(createTitle('About'));
    }
}
