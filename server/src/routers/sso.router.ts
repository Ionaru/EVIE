/* eslint-disable sonarjs/no-duplicate-string */
// eslint-disable-next-line @typescript-eslint/no-shadow
import { URL, URLSearchParams } from 'url';

import { generateRandomString } from '@ionaru/random-string';
import * as Sentry from '@sentry/node';
import { AxiosError, AxiosRequestConfig } from 'axios';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as jwt from 'jsonwebtoken';

import { SocketServer } from '../controllers/socket.controller';
import { axiosInstance, esiService } from '../index';
import { Character } from '../models/character.model';
import { User } from '../models/user.model';
import { IAuthResponseData, IJWTToken } from '../typings';

import { BaseRouter } from './base.router';

const protocol = 'https://';
const oauthHost = 'login.eveonline.com';
const authorizePath = '/v2/oauth/authorize?';
const tokenPath = '/v2/oauth/token';
const revokePath = '/v2/oauth/revoke';

export class SSORouter extends BaseRouter {

    protected static debug = BaseRouter.debug.extend('sso');

    public constructor() {
        super();
        this.createRoute('get', '/refresh', SSORouter.refreshToken);
        this.createRoute('post', '/delete', SSORouter.deleteCharacter);
        this.createRoute('post', '/activate', SSORouter.activateCharacter);
        this.createRoute('post', '/log-route-warning', SSORouter.logDeprecation);

        // SSO login
        this.createRoute('get', '/login', SSORouter.SSOLogin);
        this.createRoute('get', '/login-callback', SSORouter.SSOLoginCallback);

        // SSO character auth
        this.createRoute('get', '/auth', SSORouter.SSOAuth);
        this.createRoute('get', '/auth-callback', SSORouter.SSOAuthCallback);

        // SSO app auth
        this.createRoute('get', '/app', SSORouter.appAuth);
        this.createRoute('get', '/app-callback', SSORouter.appAuthCallback);
    }

    private static async logDeprecation(request: Request, response: Response): Promise<Response> {

        const route = request.body.route as string;
        const text = request.body.text as string;
        esiService.logWarning(route, text);

        return SSORouter.sendSuccessResponse(response);
    }

    /**
     * Get a base64 string containing the client ID and secret key for SSO login.
     */
    private static getSSOLoginString() {
        return SSORouter.createSSOString(process.env.EVIE_SSO_LOGIN_CLIENT, process.env.EVIE_SSO_LOGIN_SECRET);
    }

    /**
     * Get a base64 string containing the client ID and secret key for SSO auth.
     */
    private static getSSOAuthString() {
        return SSORouter.createSSOString(process.env.EVIE_SSO_AUTH_CLIENT, process.env.EVIE_SSO_AUTH_SECRET);
    }

    private static getAppAuthString() {
        return this.createSSOString(process.env.EVIE_SSO_APP_CLIENT, process.env.EVIE_SSO_APP_SECRET);
    }

    private static createSSOString(client?: string, secret?: string) {
        return Buffer.from(`${client}:${secret}`).toString('base64');
    }

    private static extractJWTValues(token: IJWTToken):
        { characterID: number; characterName: string; characterOwnerHash: string; characterScopes: string[] } {
        const characterID = Number(token.sub.split(':')[2]);
        const characterName = token.name;
        const characterOwnerHash = token.owner;
        const characterScopes = typeof token.scp === 'string' ? [token.scp] : token.scp;

        return {characterID, characterName, characterOwnerHash, characterScopes};
    }

    private static isJWTValid(token: IJWTToken): boolean {
        const clientIds = [process.env.EVIE_SSO_LOGIN_CLIENT, process.env.EVIE_SSO_AUTH_CLIENT];
        if (!clientIds.includes(token.azp)) {
            process.emitWarning('Authorized party is not correct.', `Expected: ${clientIds}, got: ${token.azp}`);
            return false;
        }

        if (![oauthHost, protocol + oauthHost].includes(token.iss)) {
            process.emitWarning('Unknown token issuer.', `Expected: '${oauthHost}' or '${protocol + oauthHost}', got: '${token.iss}'`);
            return false;
        }

        if (Date.now() > (token.exp * 1000)) {
            process.emitWarning('Token is expired.', `Expiry was ${((token.exp * 1000) - Date.now()) / 1000}s ago.`);
            return false;
        }

        return true;
    }

    private static async doAuthRequest(auth: string, code: string, refresh = false) {
        const requestOptions: AxiosRequestConfig = {
            headers: {
                'Authorization': 'Basic ' + auth,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        };

        const requestBody = refresh ?
            new URLSearchParams({grant_type: 'refresh_token', refresh_token: code}) :
            new URLSearchParams({code, grant_type: 'authorization_code'});

        const authUrl = `${protocol}${oauthHost}${tokenPath}`;
        SSORouter.debug(`Requesting authorization: ${code} (refresh: ${refresh})`);
        return axiosInstance.post<IAuthResponseData>(authUrl, requestBody, requestOptions).catch((error: AxiosError) => {
            process.stderr.write(`Request failed: ${authUrl}\n${error.message}\n`);
            if (error.response) {
                process.stderr.write(`${JSON.stringify(error.response.data)}\n`);
            }
            Sentry.captureException(error);
        });
    }

    private static async revokeKey(key: string, keyType: 'access_token' | 'refresh_token') {
        const requestOptions: AxiosRequestConfig = {
            headers: {
                'Authorization': 'Basic ' + SSORouter.getSSOAuthString(),
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        };

        const requestBody = new URLSearchParams({token: key, token_type_hint: keyType});

        const revokeUrl = `${protocol}${oauthHost}${revokePath}`;
        SSORouter.debug(`Revoking token of type ${keyType}: ${key}`);
        return axiosInstance.post<void>(revokeUrl, requestBody, requestOptions).catch((error: AxiosError) => {
            process.stderr.write(`Request failed: ${revokeUrl}\n${error.message}\n`);
            Sentry.captureException(error);
        });
    }

    private static async SSOLogin(request: Request, response: Response): Promise<void> {
        // Generate a random string and set it as the state of the request, we will later verify the response of the
        // EVE SSO service using the saved state. This is to prevent Cross Site Request Forgery (XSRF), see this link for details:
        // http://www.thread-safe.com/2014/05/the-correct-use-of-state-parameter-in.html
        request.session.state = generateRandomString(15);

        const url = new URL(protocol + oauthHost + authorizePath);

        url.searchParams.append('client_id', process.env.EVIE_SSO_LOGIN_CLIENT!);
        url.searchParams.append('redirect_uri', process.env.EVIE_SSO_LOGIN_CALLBACK!);
        url.searchParams.append('response_type', 'code');
        url.searchParams.append('state', request.session.state);

        response.redirect(url.toString());
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    private static async appAuth(request: Request<{}, any, any, {scopes?: string}>, response: Response): Promise<void> {
        request.session.state = generateRandomString(15);

        const url = new URL(protocol + oauthHost + authorizePath);

        url.searchParams.append('client_id', process.env.EVIE_SSO_APP_CLIENT!);
        url.searchParams.append('redirect_uri', process.env.EVIE_SSO_APP_CALLBACK!);
        url.searchParams.append('response_type', 'code');
        if (request.query.scopes) {
            url.searchParams.append('scope', request.query.scopes);
        }
        url.searchParams.append('state', request.session.state);

        response.redirect(url.toString());
    }

    private static async appAuthCallback(
        // eslint-disable-next-line @typescript-eslint/ban-types
        request: Request<{}, any, any, {code?: string; state?: string}>, response: Response,
    ): Promise<void> {

        const authResponse = await SSORouter.doAuthRequest(SSORouter.getAppAuthString(), request.query.code!);
        if (!authResponse) {
            throw new Error('Try again');
        }

        const params = new URLSearchParams({
            access_token: authResponse.data.access_token,
            expires_in: authResponse.data.expires_in.toString(),
            refresh_token: authResponse.data.refresh_token,
        });
        response.redirect(`eveauth-epm://callback?${params.toString()}`);
    }

    // If a request was somehow done without giving a state, then it probably didn't come from the SSO, possibly directly linked.
    @SSORouter.requestDecorator(SSORouter.checkQueryParameters, 'state')
    @SSORouter.requestDecorator(SSORouter.checkQueryParameters, 'code')
    private static async SSOLoginCallback(
        // eslint-disable-next-line @typescript-eslint/ban-types
        request: Request<{}, any, any, {code?: string; state?: string}>, response: Response,
    ): Promise<Response> {

        // We're verifying the state returned by the EVE SSO service with the state saved earlier.
        if (request.session.state !== request.query.state) {
            // State did not match the one we saved, possible XSRF.
            process.emitWarning(
                `Invalid state from /login-callback request! Expected '${request.session.state}' and got '${request.query.state!}'.`,
            );
            return SSORouter.sendResponse(response, StatusCodes.BAD_REQUEST, 'InvalidState');
        }
        delete request.session.state;

        const authResponse = await SSORouter.doAuthRequest(SSORouter.getSSOLoginString(), request.query.code!);

        if (!authResponse || authResponse.status !== StatusCodes.OK) {
            return SSORouter.sendResponse(response, StatusCodes.BAD_GATEWAY, 'SSOTokenResponseError');
        }

        const token = jwt.decode(authResponse.data.access_token) as IJWTToken;
        if (!SSORouter.isJWTValid(token)) {
            return SSORouter.sendResponse(response, StatusCodes.BAD_GATEWAY, 'InvalidJWTToken');
        }

        const ownerHash = SSORouter.extractJWTValues(token).characterOwnerHash;

        const characterSubQuery = Character.doQuery()
            .select('character.user')
            .where('character.ownerHash = :ownerHash', {ownerHash});

        let user: User | undefined = await User.doQuery()
            .leftJoinAndSelect('user.characters', 'character')
            .where(`user.id IN (${characterSubQuery.getQuery()})`)
            .setParameters(characterSubQuery.getParameters())
            .getOne();

        if (!user) {
            user = new User();
        }

        user.timesLogin++;
        await user.save();

        request.session.user!.id = user.id;

        const userSocket = SocketServer.sockets.find((socket) => request.session && socket.id === request.session.socket);
        if (userSocket) {
            SSORouter.debug(`Emitting to socket ${userSocket.id}, session ${userSocket.handshake.session.id}`);
            userSocket.emit('SSO_LOGON_END', {
                data: user.sanitizedCopy,
                message: 'SSOSuccessful',
                state: 'success',
            });
        }

        return response.status(StatusCodes.OK).send('<h2>You may now close this window.</h2>');
    }

    /**
     * Start the SSO process. Here we redirect the user to the SSO service and prepare for the callback
     * Params:
     *  scopes <optional>: A space-separated list of scope codes.
     */
    @SSORouter.requestDecorator(SSORouter.checkLogin)
    // eslint-disable-next-line @typescript-eslint/ban-types
    private static async SSOAuth(request: Request<{}, any, any, {scopes?: string; uuid?: string}>, response: Response): Promise<void> {

        if (request.query.uuid) {
            // With a characterUUID provided in the request, we initiate the re-authorization process

            const character: Character | undefined = await Character.doQuery()
                .where('character.uuid = :uuid', {uuid: request.query.uuid})
                .andWhere('character.userId = :userId', {userId: request.session.user!.id})
                .getOne();

            if (character) {
                request.session.uuid = character.uuid;
            }
        }

        // Generate a random string and set it as the state of the request, we will later verify the response of the
        // EVE SSO service using the saved state. This is to prevent Cross Site Request Forgery, see this link for details:
        // http://www.thread-safe.com/2014/05/the-correct-use-of-state-parameter-in.html
        request.session.state = generateRandomString(15);

        const url = new URL(protocol + oauthHost + authorizePath);

        url.searchParams.append('client_id', process.env.EVIE_SSO_AUTH_CLIENT!);
        url.searchParams.append('redirect_uri', process.env.EVIE_SSO_AUTH_CALLBACK!);
        url.searchParams.append('response_type', 'code');
        if (request.query.scopes) {
            url.searchParams.append('scope', request.query.scopes);
        }
        url.searchParams.append('state', request.session.state);

        response.redirect(url.toString());
    }

    /**
     * Process the callback from the SSO service, create/update character information before proceeding to Authorization.
     * Params:
     *  code <required>: The authorization token that will be used to get a Character's access code later in the process.
     *  state <required>: The random string that was generated and sent with the request.
     */
    @SSORouter.requestDecorator(SSORouter.checkLogin)
    // If a request was somehow done without giving a state, then it probably didn't come from the SSO, possibly directly linked.
    @SSORouter.requestDecorator(SSORouter.checkQueryParameters, 'state')
    @SSORouter.requestDecorator(SSORouter.checkQueryParameters, 'code')
    private static async SSOAuthCallback(
        // eslint-disable-next-line @typescript-eslint/ban-types
        request: Request<{}, any, any, {code?: string; state?: string}>, response: Response,
    ): Promise<Response> {

        // We're verifying the state returned by the EVE SSO service with the state saved earlier.
        if (request.session.state !== request.query.state) {
            // State did not match the one we saved, possible XSRF.
            process.emitWarning(
                `Invalid state from /auth-callback request! Expected '${request.session.state}' and got '${request.query.state!}'.`,
            );
            return SSORouter.sendResponse(response, StatusCodes.BAD_REQUEST, 'InvalidState');
        }
        delete request.session.state;

        const authResponse = await SSORouter.doAuthRequest(SSORouter.getSSOAuthString(), request.query.code!);

        if (!authResponse || authResponse.status !== StatusCodes.OK) {
            return SSORouter.sendResponse(response, StatusCodes.BAD_GATEWAY, 'SSOTokenResponseError');
        }

        const token = jwt.decode(authResponse.data.access_token) as IJWTToken;
        if (!SSORouter.isJWTValid(token)) {
            return SSORouter.sendResponse(response, StatusCodes.BAD_GATEWAY, 'InvalidJWTToken');
        }

        const {characterID, characterName, characterOwnerHash, characterScopes} = SSORouter.extractJWTValues(token);

        let user = await User.getFromId(request.session.user!.id!);

        if (!user) {
            return SSORouter.sendResponse(response, StatusCodes.NOT_FOUND, 'UserNotFound');
        }

        let character = await Character.getFromId(characterID);

        if (character && character.ownerHash !== characterOwnerHash) {
            // Character exists but has been transferred, delete the old one and create anew.
            await character.remove();
            character = undefined;
        }

        if (character && character.user.id !== request.session.user!.id) {
            // Merge Users
            await user.merge(character.user);
            await character.reload();
        }

        if (!character) {
            // New character
            character = new Character();
        }

        character.accessToken = authResponse.data.access_token;
        character.refreshToken = authResponse.data.refresh_token;
        character.tokenExpiry = new Date(Date.now() + (authResponse.data.expires_in * 1000));
        character.name = characterName;
        character.characterId = characterID;
        character.scopes = characterScopes ? characterScopes.join(' ') : '';
        character.ownerHash = characterOwnerHash;
        character.user = user;

        await character.save();

        // Remove the characterUUID from the session as it is no longer needed
        delete request.session.characterUUID;

        // Refresh user data.
        user = await User.getFromId(request.session.user!.id!);

        const userSocket = SocketServer.sockets.find((socket) => request.session && socket.id === request.session.socket);
        if (userSocket) {
            SSORouter.debug(`Emitting to socket ${userSocket.id}, session ${userSocket.handshake.session.id}`);
            userSocket.emit('SSO_AUTH_END', {
                data: {newCharacter: character.uuid, user: user!.sanitizedCopy},
                message: 'SSOSuccessful',
                state: 'success',
            });
        }

        return response.status(StatusCodes.OK).send('<h2>You may now close this window.</h2>');
    }

    /**
     * Refresh the access token by requesting a new one using the refresh token
     * Params:
     *  uuid <required>: The UUID of the Character who's token to refresh
     */
    @SSORouter.requestDecorator(SSORouter.checkLogin)
    @SSORouter.requestDecorator(SSORouter.checkQueryParameters, 'uuid')
    private static async refreshToken(request: Request, response: Response): Promise<Response> {

        // Fetch the Character who's accessToken we will refresh.
        const character = await Character.doQuery()
            .where('character.uuid = :uuid', {uuid: request.query.uuid})
            .getOne();

        if (!character || !character.refreshToken) {
            // There was no Character found with a matching UUID and userId.
            return SSORouter.sendResponse(response, StatusCodes.NOT_FOUND, 'CharacterNotFound');
        }

        const refreshResponse = await SSORouter.doAuthRequest(SSORouter.getSSOAuthString(), character.refreshToken, true);

        if (!refreshResponse || refreshResponse.status !== StatusCodes.OK) {
            return SSORouter.sendResponse(response, StatusCodes.BAD_GATEWAY, 'SSOTokenResponseError');
        }

        character.refreshToken = refreshResponse.data.refresh_token;
        character.accessToken = refreshResponse.data.access_token;
        character.tokenExpiry = new Date(Date.now() + (refreshResponse.data.expires_in * 1000));
        await character.save();

        return SSORouter.sendSuccessResponse(response, {
            token: refreshResponse.data.access_token,
        });
    }

    /**
     * Delete a character
     * Params:
     *  characterUUID <required>: The UUID of the Character to delete
     */
    @SSORouter.requestDecorator(SSORouter.checkLogin)
    @SSORouter.requestDecorator(SSORouter.checkBodyParameters, 'characterUUID')
    private static async deleteCharacter(request: Request, response: Response): Promise<Response> {

        const user: User | undefined = await User.doQuery()
            .select(['user.id'])
            .leftJoinAndSelect('user.characters', 'character')
            .where('user.id = :id', {id: request.session.user!.id})
            .getOne();

        if (!user) {
            // Missing parameters
            return SSORouter.sendResponse(response, StatusCodes.NOT_FOUND, 'UserNotFound');
        }

        const characterToDelete = user.characters.find((character) => character.uuid === request.body.characterUUID);

        if (!characterToDelete) {
            // That character does not exist
            return SSORouter.sendResponse(response, StatusCodes.NOT_FOUND, 'NoCharacterFound');
        }

        // Revoke token
        if (characterToDelete.refreshToken) {
            SSORouter.revokeKey(characterToDelete.refreshToken, 'refresh_token').then();
        }

        await characterToDelete.remove();
        return SSORouter.sendSuccessResponse(response);
    }

    /**
     * Activate a character
     * Params:
     *  characterUUID <required>: The UUID of the Character to set as active
     */
    @SSORouter.requestDecorator(SSORouter.checkLogin)
    private static async activateCharacter(request: Request, response: Response): Promise<Response> {

        await Character.doQuery()
            .update(Character)
            .set({isActive: false})
            .where('character.userId = :id', {id: request.session.user!.id})
            .execute();

        const characterUUID = request.body.characterUUID;

        if (!characterUUID) {
            return SSORouter.sendSuccessResponse(response);
        }

        const character = await Character.doQuery()
            .select(['character.id', 'character.isActive', 'character.uuid', 'character.userId'])
            .where('character.userId = :id', {id: request.session.user!.id})
            .andWhere('character.uuid = :uuid', {uuid: characterUUID})
            .getOne();

        if (!character) {
            return SSORouter.sendResponse(response, StatusCodes.NOT_FOUND, 'NoCharacterFound');
        }

        character.isActive = true;
        await character.save();
        return SSORouter.sendSuccessResponse(response);
    }
}
