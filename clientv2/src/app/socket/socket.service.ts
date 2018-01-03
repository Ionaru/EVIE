import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';
import Socket = SocketIOClient.Socket;

@Injectable()
export class SocketService {
    public static socket: Socket;

    constructor() {
        SocketService.socket = io.connect('http://localhost:3000/', {
            reconnection: true,
        });
    }
}
