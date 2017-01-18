// Typings reference file, you can add your own global typings here
// https://www.typescriptlang.org/docs/handbook/writing-declaration-files.html

// / <reference path="./ems.d.ts" />
// / <reference path="./ios.d.ts" />

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
