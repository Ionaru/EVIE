import { Injectable } from '@angular/core';
import * as SocketIOClient from 'socket.io-client';
import Socket = SocketIOClient.Socket;

import { environment } from '../../environments/environment';

@Injectable()
export class SocketService {
    public static socket: Socket;

    constructor() {
        SocketService.socket = SocketIOClient.connect(environment.socketHost, {
            reconnection: true,
        });
    }
}
