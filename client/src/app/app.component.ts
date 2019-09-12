import { HttpClient, HttpResponse } from '@angular/common/http';
import { Component } from '@angular/core';

import { environment } from '../environments/environment';
import { AppReadyEventService } from './app-ready-event.service';
import { BaseService, IServerResponse } from './data-services/base.service';
import { NamesService } from './data-services/names.service';
import { BaseGuard } from './guards/base.guard';
import { IUserApiData } from './models/user/user.model';
import { UserService } from './models/user/user.service';
import { NavigationComponent } from './navigation/navigation.component';
import { SocketService } from './socket/socket.service';

@Component({
    selector: 'app-root',
    styleUrls: ['./app.component.scss'],
    templateUrl: './app.component.html',
})
export class AppComponent {

    public readonly version = environment.VERSION;

    constructor(private appReadyEvent: AppReadyEventService, private http: HttpClient, private userService: UserService) {
        this.boot().then().catch((error) => this.appReadyEvent.triggerFailure('Error during app startup', error));
    }

    private async boot(): Promise<void> {
        localStorage.removeItem(BaseGuard.redirectKey);
        await this.shakeHands();
        new SocketService();
        NamesService.getNamesFromStore();
        SocketService.socket.on('STOP', (): void => {
            // The server will send STOP upon shutting down.
            // Reloading the window ensures nobody keeps using the site while the server is down.
            window.location.reload();
        });
        this.appReadyEvent.triggerSuccess();
    }

    private async shakeHands(): Promise<any> {
        const url = 'api/handshake';

        const response = await this.http.get<any>(url, {observe: 'response'}).toPromise<HttpResponse<IServerResponse<IUserApiData>>>();

        BaseService.serverToken = response.headers.get('x-evie-token') || '';

        if (response.body && response.body.message === 'LoggedIn' && response.body.data) {
            await this.userService.storeUser(response.body.data);
        }
    }

    // noinspection JSMethodCanBeStatic
    public get serverOnline() {
        return NavigationComponent.serverOnline;
    }
}
