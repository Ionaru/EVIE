import { Component, OnInit } from '@angular/core';

import { Title } from '@angular/platform-browser';
import { Globals } from '../../globals';
import { Character } from '../../components/character/character';
import { CharacterService } from '../../components/character/character.service';

@Component({
  templateUrl: 'dashboard.component.html',
  styleUrls: ['dashboard.component.scss'],
  providers: [CharacterService]
})
export class DashboardComponent implements OnInit {
  result: String;
  username: string;

  constructor(private title: Title, private globals: Globals, private char: CharacterService) {
  }

  ngOnInit(): void {
    this.title.setTitle('EVE Track - Dashboard');
    if (this.globals.user) {
      this.username = this.globals.user.username;
    }
  }

  startSSO(): void {

    let w = window.open('/sso/start');

    this.globals.socket.on('newCharacter', function (data) {
      w.close();
      // console.log(data);
      let character = this.char.registerCharacter(data);
      this.char.refreshToken(character);
      console.log(character);
    });

    // setTimeout(w.close(), 3000);
  }

  getFromAPI(): void {
    // this.api.getFromAPI().subscribe(result => this.result = result["result"]["rowset"]["row"])
  };
}
