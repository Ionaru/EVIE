import { Component, OnInit } from '@angular/core';

import { Title } from '@angular/platform-browser';
import { Globals } from '../../globals';

@Component({
  templateUrl: 'dashboard.component.html',
  styleUrls: ['dashboard.component.scss'],
  providers: []
})
export class DashboardComponent implements OnInit {
  result: String;
  username: string;

  constructor(private title: Title, private globals: Globals) {
  }

  ngOnInit(): void {
    this.title.setTitle('EVE Track - Dashboard');
    this.globals.isLoggedIn.subscribe(() => {
      if (this.globals.user) {
        this.username = this.globals.user.username;
      }
    });
    // this.getFromAPI();
  }

  getFromAPI(): void {
    // this.api.getFromAPI().subscribe(result => this.result = result["result"]["rowset"]["row"])
  };

}
