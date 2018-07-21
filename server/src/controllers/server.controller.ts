import { Application } from 'express';
import { createServer, Server } from 'http';
import { logger } from 'winston-pnp-logger';

import { config } from './configuration.controller';

export class WebServer {

    public server: Server;
    private readonly port: number;

    constructor(expressApplication: Application) {
        logger.info('Creating web server');
        this.server = createServer(expressApplication as any);
        this.port = config.getProperty('server_port') as number || 1234;
        this.server.listen(this.port);
        this.server.on('error', (error) => this.serverError(error));
        this.server.on('listening', () => this.announceListening());
    }

    /**
     * Function that is called when the server has started listening for requests.
     */
    private announceListening(): void {
        logger.info(`Listening on port ${this.port}`);
        logger.info('Ready for connections...');
    }

    private serverError(error: any): void {
        if (error.syscall !== 'listen') {
            throw error;
        }

        // Handle specific listen errors with useful messages.
        switch (error.code) {
            case 'EACCES':
                logger.error(`Port ${this.port} requires elevated privileges`);
                throw error;
            case 'EADDRINUSE':
                logger.error(`Port ${this.port} is already in use`);
                throw error;
            default:
                throw error;
        }
    }
}
