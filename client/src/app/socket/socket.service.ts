import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

import { environment } from '../../environments/environment';

@Injectable()
export class SocketService {
    public static socket: Socket;

    constructor() {
        SocketService.socket = io(environment.socketHost, {
            reconnection: true,
        });
    }
}
