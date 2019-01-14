import { HttpClient } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';

import { Common } from '../../../shared/common.helper';
import { BaseGuard } from '../../guards/base.guard';
import { SocketService } from '../../socket/socket.service';
import { Character, IApiCharacterData } from '../character/character.model';
import { CharacterService } from '../character/character.service';
import { ISSOAuthResponse, ISSOLoginResponse, IUserApiData, User } from './user.model';

@Injectable()
export class UserService {

    private static authWindow?: Window | null;

    private static _userChangeEvent = new Subject<User>();
    public static get userChangeEvent() { return this._userChangeEvent; }

    private static _user: User;
    public static get user() { return this._user; }

    private static openCenteredPopup(url: string, w: number, h: number) {
        const dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screenX;
        const dualScreenTop = window.screenTop !== undefined ? window.screenTop : window.screenY;

        if (document.documentElement) {
            const docWidth = document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
            const docHeight = document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

            const width = window.innerWidth ? window.innerWidth : docWidth;
            const height = window.innerHeight ? window.innerHeight : docHeight;

            const left = ((width / 2) - (w / 2)) + dualScreenLeft;
            const top = ((height / 2) - (h / 2)) + dualScreenTop;
            const newWindow = window.open(url, '_blank', 'width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);

            // Puts focus on the newWindow
            if (window.focus && newWindow) {
                newWindow.focus();
            }

            return newWindow;
        }
        return;
    }

    constructor(private http: HttpClient, private characterService: CharacterService, private router: Router, private ngZone: NgZone) { }

    public logoutUser(): void {
        const url = 'api/logout';
        this.http.post(url, {}).toPromise().then(() => {
            localStorage.removeItem(BaseGuard.redirectKey);
            sessionStorage.clear();
            window.location.reload();
        });
    }

    public async storeUser(data: IUserApiData, newCharacterUUID?: string): Promise<User> {
        const user = new User(data);
        UserService._user = user;

        // Register all the characters in parallel, but wait until they are all finished before continuing
        await Promise.all(data.characters.map(async (characterData) => {
            await this.addCharacter(characterData);
        }));

        if (newCharacterUUID) {
            this.characterService.setActiveCharacter(user.characters.filter((character) => character.uuid === newCharacterUUID)[0]).then();
        } else if (user.characters && user.characters.length && !CharacterService.selectedCharacter) {
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
            UserService.authWindow = UserService.openCenteredPopup(url, 600, 850);
        }

        if (UserService.authWindow) {
            SocketService.socket.once('SSO_LOGON_END', async (response: ISSOLoginResponse) => {
                if (UserService.authWindow && !UserService.authWindow.closed) {
                    UserService.authWindow.close();
                    if (response.state === 'success') {
                        await this.storeUser(response.data);
                        const afterLoginUrl = localStorage.getItem(BaseGuard.redirectKey) || '/dashboard';
                        this.ngZone.run(() => this.router.navigate([afterLoginUrl])).then();
                        localStorage.removeItem(BaseGuard.redirectKey);
                    }
                }
            });
        }
    }

    public authCharacter(scopes?: string[]): void {
        let url = '/sso/auth';

        if (scopes) {
            url += '?scopes=' + scopes.join(' ');
        }

        if (UserService.authWindow && !UserService.authWindow.closed) {
            UserService.authWindow.focus();
        } else {
            UserService.authWindow = UserService.openCenteredPopup(url, 600, 850);
        }

        if (UserService.authWindow) {
            SocketService.socket.once('SSO_AUTH_END', async (response: ISSOAuthResponse) => {
                if (UserService.authWindow && !UserService.authWindow.closed) {
                    UserService.authWindow.close();
                    if (response.state === 'success') {
                        await this.storeUser(response.data.user, response.data.newCharacter);
                        this.router.navigate(['/dashboard']).then();
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
