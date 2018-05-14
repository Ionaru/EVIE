import * as express from 'express';
import * as SocketIO from 'socket.io';
import * as SocketIOSession from 'socket.io-express-session';

import { WebServer } from './server.controller';

export class SocketServer {

    public static sockets: ISessionSocket[] = [];

    public io: SocketIO.Server;

    constructor(webServer: WebServer, sessionParser: express.RequestHandler) {

        // Create the HTTP server and give it the Express application for settings
        this.io = SocketIO.listen(webServer.server);

        // The websocket server listens on '/'
        const socketServer = this.io.of('/');

        // The websocket server needs the sessionParser to parse... sessions!
        socketServer.use(SocketIOSession(sessionParser));

        // On connection with a client, save the socket ID to the client session and add it to the list of connected sockets
        socketServer.on('connection', async (socket: ISessionSocket) => {
            socket.handshake.session.socket = socket.id;
            socket.handshake.session.save(() => undefined);
            SocketServer.sockets.push(socket);

            // Remove the socket from the socket list when a client disconnects
            socket.on('disconnect', async () => {
                SocketServer.sockets.splice(SocketServer.sockets.indexOf(socket), 1);
            });
        });
    }
}
