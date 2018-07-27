import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as crypto from 'crypto-js';
import { Subject } from 'rxjs';

import { Common } from '../../../shared/common.helper';
import { SocketService } from '../../socket/socket.service';
import { Character, IApiCharacterData, ISSOSocketResponse } from '../character/character.model';
import { CharacterService } from '../character/character.service';
import { ILoginResponse, IRegisterResponse, IUserApiData, User } from './user.model';

@Injectable()
export class UserService {

    private static _userChangeEvent = new Subject<User>();
    public static get userChangeEvent() { return this._userChangeEvent; }

    private static _user: User;
    public static get user() { return this._user; }

    private static hashPassword(passwordPlain: string): string {
        return crypto.enc.Base64.stringify(crypto.SHA256(passwordPlain));
    }

    constructor(private http: HttpClient, private characterService: CharacterService) { }

    public async loginUser(username: string, password: string): Promise<[string, User | undefined]> {

        const url = 'api/login';
        const body = {
            // Hash the password so it is never sent over the wire as plain text.
            password: UserService.hashPassword(password),
            username,
        };

        const response = await this.http.post<any>(url, body).toPromise<ILoginResponse>()
            .catch((errorResponse: HttpErrorResponse) => {
                if (errorResponse.error) {
                    const errorBody = errorResponse.error;
                    if (errorBody.hasOwnProperty('state') && errorBody.hasOwnProperty('message')) {
                        return errorResponse.error as ILoginResponse;
                    }
                }
                throw errorResponse.error;
            });

        if (response.message === 'LoggedIn' && response.data) {
            const user = await this.storeUser(response.data);
            return [response.message, user];
        } else {
            return [response.message, undefined];
        }
    }

    public logoutUser(): void {
        const url = 'api/logout';
        this.http.post(url, {}).toPromise().then(() => {
            sessionStorage.clear();
            window.location.reload();
        });
    }

    public async registerUser(username: string, email: string, password: string): Promise<string> {
        const url = 'api/register';
        const userToRegister = {
            email,
            password: UserService.hashPassword(password),
            username,
        };
        const response = await this.http.post<any>(url, userToRegister).toPromise<IRegisterResponse>()
            .catch((errorResponse: HttpErrorResponse) => {
                if (errorResponse.status === 409) {
                    return errorResponse.error as IRegisterResponse;
                }
                throw errorResponse.error;
            });
        if (response.data.username_in_use) {
            return 'username_in_use';
        } else if (response.data.email_in_use) {
            return 'email_in_use';
        } else if (response.state === 'error') {
            return 'error';
        } else {
            return 'success';
        }
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

    public authCharacter(character?: Character): void {
        let url = '/sso/start';
        if (character) {
            url += '?characterUUID=' + character.uuid;
        }

        const authWindow = window.open(url, '_blank', 'width=600,height=850');

        if (authWindow) {
            SocketService.socket.on('SSO_END', async (response: ISSOSocketResponse) => {
                authWindow.close();
                if (response.state === 'success') {
                    if (character) {
                        character.updateAuth(response.data);
                    } else {
                        character = await this.addCharacter(response.data);
                    }
                    this.characterService.setActiveCharacter(character).then();
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
