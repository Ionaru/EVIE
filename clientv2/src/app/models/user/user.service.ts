import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
// import { Http, Response } from '@angular/http';
// import { Logger } from 'angular2-logger/core';
import * as crypto from 'crypto-js';

// import { CharacterService } from '../character/character.service';
import { ILoginResponse, IRegisterResponse, IUserApiData, User } from './user.model';
import { Subject } from 'rxjs/Subject';
import { CharacterService } from '../character/character.service';

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

        if (response.message === 'LoggedIn') {
            const user = await this.storeUser(response.data);
            return [response.message, user];
        } else {
            return [response.message, null];
        }
    }

    public logoutUser(): void {
        const url = 'api/logout';
        this.http.post(url, {}).toPromise().then(() => {
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
        // let response: Response;
        // try {
        //     response = await this.http.post(url, userToRegister).toPromise().catch((errorResponse: Response) => {
        //         if (errorResponse.status === 409) {
        //             return errorResponse;
        //         }
        //         throw new Error(errorResponse.toString());
        //     });
        //     const result: IRegisterResponse = response.json();
        //     if (result.data.username_in_use) {
        //         return 'username_in_use';
        //     } else if (result.data.email_in_use) {
        //         return 'email_in_use';
        //     } else if (result.state === 'error') {
        //         return 'error';
        //     } else {
        //         return 'success';
        //     }
        // } catch (error) {
        //     // this.logger.error(error);
        //     return null;
        // }

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
                const character = await this.characterService.registerCharacter(characterData);
                UserService.user.characters.push(character);
            }
        }));

        // if (!Helpers.isEmpty(user.characters) && !this.globals.selectedCharacter) {
        //     this.characterService.setActiveCharacter(user.characters[0]).then();
        // }
        UserService.userChangeEvent.next(user);
        return user;
    }
}
