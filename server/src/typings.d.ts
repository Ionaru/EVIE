import Socket = SocketIO.Socket;
import Session = Express.Session;

interface ISessionSocket extends Socket {
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
  function winstonDRF(arg: object): void;
  namespace winstonDRF {}
  export = winstonDRF;
}
