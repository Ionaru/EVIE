/**
 * Module dependencies.
 */
import http = require('http');
import sio = require('socket.io');
import ios = require('socket.io-express-session');

import { logger } from '../controllers/logger.service';
import { App } from '../app';
import { db } from '../controllers/db.service';
import { mainConfig } from '../controllers/config.service';
import { Server } from 'http';

export let sockets: Array<SessionSocket> = [];
export let express: App;
export let server: Server;
export let io: SocketIO.Server;

/**
 * This function initialises the entire server
 */
export async function init(): Promise<void> {
  // Create the express application and fire the main startup sequence
  express = new App();
  await express.mainStartupSequence();

  // Get port from environment || config || default and store in Express.
  const port = normalizePort(process.env.PORT || mainConfig.get('backend_port') || 3000);
  express.app.set('port', port);

  // Create the HTTP server and give it the Express application for settings
  server = http.createServer(express.app);

  // Start a websocket server using the HTTP server for settings
  io = sio.listen(server);

  // The websocket server listens on '/'
  const socketServer = io.of('/');

  // The websocket server needs the sessionParser to parse... sessions!
  socketServer.use(ios(express.sessionParser));

  // On connection with a client, save the socket ID to the client session and add it to the list of connected sockets
  socketServer.on('connection', async(socket: SessionSocket) => {
    socket.handshake.session['socket'] = socket.id;
    await socket.handshake.session.save(() => {});
    sockets.push(socket);

    // Remove the socket from the socket list when a client disconnects
    socket.on('disconnect', async() => {
      sockets.splice(sockets.indexOf(socket), 1);
    });
  });

  // Listen on provided port, on all network interfaces.
  server.listen(port);

  // The 'listen' function call above returns 'error' or 'listening', we act on those events
  server.on('error', onError);
  server.on('listening', onListening);

  // When a signal is sent that would normally stop the application, resume and shut the application down gracefully
  process.stdin.resume();
  process.on('SIGINT', exit.bind(null, {cleanup: true}));

  // Also perform a graceful shutdown when an uncaught exception is thrown, except when in a testing environment
  if (process.env.TEST !== 'true') {
    process.on('uncaughtException', exit.bind(null, {cleanup: true}));
  }

  // Promises that fail should not cause the application to stop, instead we print the error
  process.on('unhandledRejection', function (reason: string, p: Promise<any>): void {
    logger.error('Unhandled Rejection at: Promise ', p, ' reason: ', reason);
  });

  /**
   * Normalize a port into a number, string, or false.
   */
  function normalizePort(val: any): boolean | number {

    const normalizedPort = parseInt(val, 10);

    if (isNaN(normalizedPort)) {
      // named pipe
      return val;
    }

    if (normalizedPort >= 0) {
      // port number
      return normalizedPort;
    }

    return false;
  }

  /**
   * Event listener for HTTP server 'error' event.
   */
  function onError(error: any): void {
    if (error.syscall !== 'listen') {
      throw error;
    }

    const bind = typeof port === 'string'
      ? 'Pipe ' + port
      : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        logger.error(bind + ' requires elevated privileges');
        throw error;
      case 'EADDRINUSE':
        logger.error(bind + ' is already in use');
        throw error;
      default:
        throw error;
    }
  }

  /**
   * Event listener for HTTP server 'listening' event.
   */
  function onListening(): void {
    const addr = server.address();
    const bind = typeof addr === 'string'
      ? 'pipe ' + addr
      : 'port ' + addr.port;
    logger.info('Listening on ' + bind);
  }
}

/**
 * This function will ensure everything is shut down gracefully
 */
export function cleanup(callback: Function): void {
  logger.info('Executing cleanup tasks.');

  express.sessionStore.clear((sessionStoreError) => {
    if (sessionStoreError) {
      logger.error('Error while clearing session store');
      logger.error(sessionStoreError);
    } else {
      logger.info('Session store closed');
    }
    db.seq.close();
    db.get().end((databaseError) => {
      if (databaseError) {
        logger.error('Error while closing Database connection');
        logger.error(databaseError);
      } else {
        logger.info('Database connection closed');
      }
      io.emit('STOP');
      io.close();
      server.close(() => {
        logger.info(`Http server closed`);
        callback();
      });
    });
  });
}

/**
 * Function that gets executed when the app shuts down
 */
function exit(options: Object, err?: any): void {
  logger.info('Got shutdown event, starting shutdown sequence');

  // Ensure the app shuts down when there is an exception during shutdown
  process.on('uncaughtException', () => {
    process.exit(1);
  });
  process.on('unhandledRejection', (reason: string, p: Promise<any>): void => {
    console.error('Unhandled Rejection at: Promise ', p, ' reason: ', reason);
    process.exit(1);
  });

  if (options['cleanup']) {
    cleanup(() => {
      logger.info('Cleanup tasks done');
      shutdown(err);
    });
  } else {
    shutdown(err);
  }
}

function shutdown(err?: any): void {
  if (err) {
    logger.error('Shutdown was the result of an uncaught error, more details below');
    logger.error(err);
  } else {
    logger.info('Shutdown complete, goodbye!');
  }
  process.exit(0);
}
