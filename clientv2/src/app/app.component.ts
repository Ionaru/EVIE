import { Component } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import * as io from 'socket.io-client';
import Socket = SocketIOClient.Socket;

import { AppReadyEvent } from './app-ready.event';
import { User, IUserApiData } from './models/user/user.model';
import { UserService } from './models/user/user.service';


interface IHandshakeResponse {
    state: string;
    message: string;
    data?: IUserApiData;
}

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {

    public static socket: Socket;
    public version = '0.2.0-INDEV';

    constructor(private appReadyEvent: AppReadyEvent, private http: HttpClient, private userService: UserService) {
        this.boot().then().catch((error) => this.appReadyEvent.triggerFailure('Unexpected error', error));
    }

    private async boot(): Promise<void> {
        UserService.userChangeEvent.subscribe((newUser: User) => {
            console.log(newUser);
        });

        await this.shakeHands();
        AppComponent.socket = io.connect('http://localhost:3000/', {
            reconnection: true,
        });
        AppComponent.socket.on('STOP', (): void => {
            // The server will send STOP upon shutting down.
            // Reloading the window ensures nobody keeps using the site while the server is down.
            window.location.reload();
        });
        this.appReadyEvent.triggerSuccess();
    }

    private async shakeHands(): Promise<any> {
        console.log('Shake shake');
        const url = 'api/handshake';
        const response = await this.http.get<any>(url).toPromise<IHandshakeResponse>().catch((error: HttpErrorResponse) => {
            this.appReadyEvent.triggerFailure(error.message, error.error);
        });

        if (response && response.message === 'LoggedIn') {
            console.log('Storing user');
            await this.userService.storeUser(response.data);
        }
    }
}
