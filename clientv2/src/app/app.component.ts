import { Component } from '@angular/core';
import { AppReadyEvent } from './app-ready.event';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
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
    title = 'app';

    constructor(private appReadyEvent: AppReadyEvent, private http: HttpClient, private userService: UserService) {
        this.boot().then().catch((error) => this.appReadyEvent.triggerFailure('Unexpected error', error));
    }

    private async boot(): Promise<void> {
        UserService.userChangeEvent.subscribe((newUser: User) => {
            console.log(newUser);
        });

        // await this.userService.loginUser('testUser', '000999888');

        await this.shakeHands();
        this.appReadyEvent.triggerSuccess();
    }

    private async shakeHands(): Promise<any> {
        const url = 'api/handshake';
        const response = await this.http.get<any>(url).toPromise<IHandshakeResponse>().catch((error: HttpErrorResponse) => {
            this.appReadyEvent.triggerFailure(error.message, error.error);
        });

        if (response && response.message === 'LoggedIn') {
            await this.userService.storeUser(response.data);
        }
    }
}
