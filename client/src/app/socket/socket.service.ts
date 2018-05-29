import { Injectable } from '@angular/core';
import * as SocketIOClient from 'socket.io-client';
import Socket = SocketIOClient.Socket;

@Injectable()
export class SocketService {
    public static socket: Socket;

    constructor() {
        SocketService.socket = SocketIOClient.connect('http://localhost:3000/', {
            reconnection: true,
        });
    }
}
