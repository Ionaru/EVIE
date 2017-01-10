import { Component, OnInit } from '@angular/core';

import { Title } from '@angular/platform-browser';
import { Globals } from '../../globals';
import { CharacterService } from '../../components/character/character.service';

interface SSOSocketResponse {
  state: string;
  message: string;
  data: CharacterApiData | undefined;
}

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

    this.globals.socket.on('SSO_END', (response: SSOSocketResponse): void => {
      w.close();
      console.log(response);
      if (response.state === 'success') {
        let character = this.char.registerCharacter(response.data);
        this.globals.selectedCharacter = character;
        console.log(this.globals.selectedCharacter);
      }
    });

    // setTimeout(w.close(), 3000);
  }

  refreshToken(): void {
    this.char.refreshToken(this.globals.selectedCharacter).subscribe(() => {
      console.log(this.globals.selectedCharacter);
    });
  }

  getFromAPI(): void {
    // this.api.getFromAPI().subscribe(result => this.result = result["result"]["rowset"]["row"])
  };
}
