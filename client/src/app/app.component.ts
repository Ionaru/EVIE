import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';

import { AppReadyEventService } from './app-ready-event.service';
import { IUserApiData } from './models/user/user.model';
import { UserService } from './models/user/user.service';
import { NavigationComponent } from './navigation/navigation.component';
import { SocketService } from './socket/socket.service';
import { TypesService } from './data-services/types.service';

interface IHandshakeResponse {
    state: string;
    message: string;
    data?: IUserApiData;
}

@Component({
    selector: 'app-root',
    styleUrls: ['./app.component.scss'],
    templateUrl: './app.component.html',
})
export class AppComponent {

    public version = '0.3.0-INDEV';

    constructor(private appReadyEvent: AppReadyEventService, private http: HttpClient, private userService: UserService,
                private types: TypesService) {
        this.boot().then().catch((error) => this.appReadyEvent.triggerFailure('Error during app startup', error));
    }

    private async boot(): Promise<void> {
        await this.shakeHands();
        new SocketService();
        SocketService.socket.on('STOP', (): void => {
            // The server will send STOP upon shutting down.
            // Reloading the window ensures nobody keeps using the site while the server is down.
            window.location.reload();
        });
        this.appReadyEvent.triggerSuccess();
        await this.types.getTypes();
    }

    private async shakeHands(): Promise<any> {
        const url = 'api/handshake';

        const response = await this.http.get<any>(url).toPromise<IHandshakeResponse>();

        if (response && response.message === 'LoggedIn' && response.data) {
            await this.userService.storeUser(response.data);
        }
    }

    // noinspection JSMethodCanBeStatic
    public get serverOnline() {
        return NavigationComponent.serverOnline;
    }
}
