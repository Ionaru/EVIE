import * as SocketIO from 'socket.io';
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

interface IAuthResponseData {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
}

interface IVerifyResponseData {
    CharacterID: number;
    CharacterName: string;
    ExpiresOn: string;
    Scopes: string;
    TokenType: string;
    CharacterOwnerHash: string;
    IntellectualProperty: string;
}
