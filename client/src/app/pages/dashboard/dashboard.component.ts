import { Component, OnInit } from '@angular/core';

import { Title } from '@angular/platform-browser';
import { Globals } from '../../globals';

import * as autobahn from 'autobahn';
import * as socketIo from 'socket.io-client';

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
    let connection = new autobahn.Connection({
      url: 'http://localhost:3000',
      realm: 'realm1'
    });

    connection.onopen = (session) => {
      // session.subscribe()
    };

    connection.open();

  }

  startSSO(): void {

    // let w = window.open('/sso/start');
    // w.addEventListener('message', message => {
    //   console.log(message.data);
    //   console.log(message);
    //   w.close();
    // });

    let socket = socketIo('http://localhost:3000', {
      reconnection: true
    });
    socket.on('news', function (data) {
      console.log(data);
      socket.emit('my other event', { my: 'data' });
    });

    // setTimeout(w.close(), 3000);
  }

  getFromAPI(): void {
    // this.api.getFromAPI().subscribe(result => this.result = result["result"]["rowset"]["row"])
  };

}
