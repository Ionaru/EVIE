import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';

@Injectable()
export class SocketService {
    public static socket: io.Socket;

    constructor() {
        SocketService.socket = io.connect('http://localhost:3000/', {
            reconnection: true,
        });
    }
}
