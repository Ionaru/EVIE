// Typings reference file, you can add your own global typings here
// https://www.typescriptlang.org/docs/handbook/writing-declaration-files.html

import Socket = SocketIO.Socket;
import Session = Express.Session;

interface SessionSocket extends Socket {
  handshake: {
    session: Session;
    headers: any;
    time: string;
    address: string;
    xdomain: boolean;
    secure: boolean;
    issued: number;
    url: string;
    query: any;
  };
}

declare module 'express-mysql-session' {
  function ems(session: any): any;
  namespace ems {}
  export = ems;
}

declare module 'socket.io-express-session' {
  function ios(session: any): any;
  namespace ios {}
  export = ios;
}

declare module 'winston-daily-rotate-file' {
  function winstonDRF(arg: Object): void;
  namespace winstonDRF {}
  export = winstonDRF;
}
