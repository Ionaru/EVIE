import { WebServer } from '@ionaru/web-server';
import * as express from 'express';
import { Session, SessionData } from 'express-session';
import { Server, Socket } from 'socket.io';
import * as SocketIOSession from 'socket.io-express-session';
import { Handshake } from 'socket.io/dist/socket';

import { debug } from '../index';

interface IHandshake extends Handshake {
    session: Session & SessionData;
}

interface ISessionSocket extends Socket {
    handshake: IHandshake;
}

export class SocketServer {

    public static sockets: ISessionSocket[] = [];

    private static debug = debug.extend('socket');

    public io: Server;

    public constructor(webServer: WebServer, sessionParser: express.RequestHandler) {

        // Pass the HTTP server to SocketIO for configuration.
        this.io = new Server(webServer.server, {
            // SocketIO cookie is unused: https://github.com/socketio/socket.io/issues/2276#issuecomment-147184662
            cookie: false,
        });

        // The websocket server listens on '/'
        const socketServer = this.io.of('/');

        // The websocket server needs the sessionParser to parse... sessions!
        socketServer.use(SocketIOSession(sessionParser));

        // On connection with a client, save the socket ID to the client session and add it to the list of connected sockets
        socketServer.on('connection', async (socket: ISessionSocket) => {
            socket.handshake.session.socket = socket.id;
            socket.handshake.session.save(() => undefined);
            SocketServer.debug(`Socket connect: ${socket.id}, session ${socket.handshake.session.id}, namespace: ${socket.nsp.name}`);
            SocketServer.sockets.push(socket);

            // Remove the socket from the socket list when a client disconnects
            socket.on('disconnect', async () => {
                SocketServer.debug(`Socket disconnect: ${socket.id}, session ${socket.handshake.session.id}`);
                SocketServer.sockets.splice(SocketServer.sockets.indexOf(socket), 1);
            });
        });
    }
}
