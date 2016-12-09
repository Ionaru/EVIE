import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
// import { User } from '../../components/user/user';


@Component({
  templateUrl: 'index.component.html',
  styleUrls: ['index.component.scss']
})
export class IndexComponent {
  constructor(title: Title) {
    title.setTitle('EVE Track - Home');
  }
}
