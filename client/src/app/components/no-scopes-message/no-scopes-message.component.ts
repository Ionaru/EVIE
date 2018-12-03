import { Component } from '@angular/core';
import { faEyeSlash } from '@fortawesome/pro-regular-svg-icons';

@Component({
  selector: 'app-no-scopes-message',
  styleUrls: ['./no-scopes-message.component.scss'],
  templateUrl: './no-scopes-message.component.html',
})
export class NoScopesMessageComponent {
    public noScopesIcon = faEyeSlash;
}
