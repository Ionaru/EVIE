import { Component, OnInit } from '@angular/core';

import { Title } from '@angular/platform-browser';
import { Globals } from '../../globals';
import { CharacterService } from '../../components/character/character.service';
import { Character } from '../../components/character/character';

@Component({
  templateUrl: 'dashboard.component.html',
  styleUrls: ['dashboard.component.scss'],
  providers: [CharacterService]
})
export class DashboardComponent implements OnInit {
  result: String;
  username: string;

  constructor(private title: Title, private globals: Globals, private characterService: CharacterService) {
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
        this.globals.selectedCharacter = this.characterService.registerCharacter(response.data);
        console.log(this.globals.selectedCharacter);
      }
    });

    // setTimeout(w.close(), 3000);
  }

  refreshToken(): void {
    this.characterService.refreshToken(this.globals.selectedCharacter).subscribe();
  }

  reAuth(): void {
    this.characterService.reAuthenticate(this.globals.selectedCharacter);
  }

  dumpCharacter(): void {
    this.characterService.dumpCharacter(this.globals.selectedCharacter);
  };

  getCharacters(): Array<Character> {
    return this.globals.user.characters;
  }
}
