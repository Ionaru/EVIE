import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';

@Component({
    selector: 'app-loading-message',
    styleUrls: ['./loading-message.component.scss'],
    templateUrl: './loading-message.component.html',
})
export class LoadingMessageComponent implements OnInit {

    @Input()
    public small = false;

    @ViewChild('spinner', {
        static: true,
    })
    public spinner?: ElementRef;

    public ngOnInit(): void {
        if (this.spinner && this.small) {
            this.spinner.nativeElement.classList.add('spinner-border-sm');
        }
    }
}
