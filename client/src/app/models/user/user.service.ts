import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';

import { Common } from '../../../shared/common.helper';
import { SocketService } from '../../socket/socket.service';
import { Character, IApiCharacterData } from '../character/character.model';
import { CharacterService } from '../character/character.service';
import { ISSOLoginResponse, IUserApiData, User } from './user.model';

@Injectable()
export class UserService {

    private static authWindow?: Window | null;

    private static _userChangeEvent = new Subject<User>();
    public static get userChangeEvent() { return this._userChangeEvent; }

    private static _user: User;
    public static get user() { return this._user; }

    constructor(private http: HttpClient, private characterService: CharacterService, private router: Router) { }

    public logoutUser(): void {
        const url = 'api/logout';
        this.http.post(url, {}).toPromise().then(() => {
            sessionStorage.clear();
            window.location.reload();
        });
    }

    public async storeUser(data: IUserApiData): Promise<User> {
        const user = new User(data);
        UserService._user = user;

        // Register all the characters in parallel, but wait until they are all finished before continuing
        await Promise.all(data.characters.map(async (characterData) => {
            if (characterData.scopes) {
                await this.addCharacter(characterData);
            }
        }));

        if (user.characters && user.characters.length && !CharacterService.selectedCharacter) {
            this.characterService.setActiveCharacter(user.characters[0]).then();
        }
        UserService.userChangeEvent.next(user);
        return user;
    }

    public async addCharacter(data: IApiCharacterData): Promise<Character> {
        const character = await this.characterService.registerCharacter(data);
        UserService.user.characters.push(character);
        Common.sortArrayByObjectProperty(UserService.user.characters, 'name');
        return character;
    }

    public ssoLogin() {
        const url = '/sso/login';

        if (UserService.authWindow && !UserService.authWindow.closed) {
            UserService.authWindow.focus();
        } else {
            UserService.authWindow = window.open(url, '_blank', 'width=600,height=850');
        }

        if (UserService.authWindow) {
            SocketService.socket.once('SSO_LOGON_END', async (response: ISSOLoginResponse) => {
                if (UserService.authWindow && !UserService.authWindow.closed) {
                    UserService.authWindow.close();
                    if (response.state === 'success') {
                        await this.storeUser(response.data);
                        this.router.navigate(['/dashboard']).then();
                    }
                }
            });
        }
    }

    public authCharacter(character?: Character): void {
        let url = '/sso/auth';
        if (character) {
            url += '?characterUUID=' + character.uuid;
        }

        if (UserService.authWindow && !UserService.authWindow.closed) {
            UserService.authWindow.focus();
        } else {
            UserService.authWindow = window.open(url, '_blank', 'width=600,height=850');
        }

        if (UserService.authWindow) {
            SocketService.socket.once('SSO_AUTH_END', async (response: ISSOLoginResponse) => {
                if (UserService.authWindow && !UserService.authWindow.closed) {
                    UserService.authWindow.close();
                    if (response.state === 'success') {
                        this.storeUser(response.data).then();
                    }
                }
            });
        }
    }

    public async deleteCharacter(character: Character): Promise<void> {
        await this.characterService.deleteCharacter(character);
        const index = UserService.user.characters.indexOf(character);
        UserService.user.characters.splice(index, 1);
    }
}
