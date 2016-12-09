import { Component, OnInit } from '@angular/core';

import { Title } from '@angular/platform-browser';

@Component({
  templateUrl: 'dashboard.component.html',
  styleUrls: ['dashboard.component.scss'],
  providers: []
})
export class DashboardComponent implements OnInit {
  result: String;

  constructor(private title: Title) {
  }

  ngOnInit() {
    this.title.setTitle('EVE Track - Dashboard');
    // this.getFromAPI();
  }

  getFromAPI() {
    // this.api.getFromAPI().subscribe(result => this.result = result["result"]["rowset"]["row"])
  };

}
