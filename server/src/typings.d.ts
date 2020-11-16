/* eslint-disable camelcase */

interface IAuthResponseData {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
}

interface IJWTToken {
    scp: string[] | string;
    jti: string;
    kid: string;
    sub: string;
    azp: string;
    name: string;
    owner: string;
    exp: number;
    iss: string;
}

import 'express-session';

declare module 'express-session' {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface SessionData {
        characterUUID?: string;
        token?: string;
        socket?: string;
        state?: string;
        user: {
            id?: number;
        };
        uuid?: string;
    }
}
