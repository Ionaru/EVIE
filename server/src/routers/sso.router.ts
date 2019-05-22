import { generateRandomString } from '@ionaru/random-string';
import * as Sentry from '@sentry/node';
import { AxiosError, AxiosRequestConfig } from 'axios';
import { Request, Response } from 'express';
import * as httpStatus from 'http-status-codes';
import * as jwt from 'jsonwebtoken';
import { URLSearchParams } from 'url';

import { SocketServer } from '../controllers/socket.controller';
import { axiosInstance, config, esiService } from '../index';
import { Character } from '../models/character.model';
import { User } from '../models/user.model';
import { BaseRouter } from './base.router';

const protocol = 'https://';
const oauthHost = 'login.eveonline.com';
const authorizePath = '/v2/oauth/authorize?';
const tokenPath = '/v2/oauth/token';
const revokePath = '/v2/oauth/revoke';

export class SSORouter extends BaseRouter {

    protected static debug = BaseRouter.debug.extend('sso');

    private static async SSOLogin(request: Request, response: Response): Promise<Response> {
        // Generate a random string and set it as the state of the request, we will later verify the response of the
        // EVE SSO service using the saved state. This is to prevent Cross Site Request Forgery (XSRF), see this link for details:
        // http://www.thread-safe.com/2014/05/the-correct-use-of-state-parameter-in.html
        request.session!.state = generateRandomString(15);
        const args = [
            'response_type=code',
            'redirect_uri=' + config.getProperty('SSO_login_redirect_uri'),
            'client_id=' + config.getProperty('SSO_login_client_ID'),
            'scope=', // TODO: Remove when https://github.com/ccpgames/sso-issues/issues/40 is solved.
            'state=' + request.session!.state,
        ];
        const authorizeURL = protocol + oauthHost + authorizePath + args.join('&');

        response.redirect(authorizeURL);
        return response.send();
    }

    // If a request was somehow done without giving a state, then it probably didn't come from the SSO, possibly directly linked.
    @BaseRouter.requestDecorator(BaseRouter.checkQueryParameters, 'state')
    private static async SSOLoginCallback(request: Request, response: Response): Promise<Response> {

        // We're verifying the state returned by the EVE SSO service with the state saved earlier.
        if (request.session!.state !== request.query.state) {
            // State did not match the one we saved, possible XSRF.
            process.emitWarning(
                `Invalid state from /login-callback request! Expected '${request.session!.state}' and got '${request.query.state}'.`,
            );
            return SSORouter.sendResponse(response, httpStatus.BAD_REQUEST, 'InvalidState');
        }
        delete request.session!.state;

        const authResponse = await SSORouter.doAuthRequest(SSORouter.getSSOLoginString(), request.query.code);

        if (!authResponse || authResponse.status !== httpStatus.OK) {
            return SSORouter.sendResponse(response, httpStatus.BAD_GATEWAY, 'SSOTokenResponseError');
        }

        const token = jwt.decode(authResponse.data.access_token) as IJWTToken;
        if (!SSORouter.isJWTValid(token)) {
            return SSORouter.sendResponse(response, httpStatus.BAD_GATEWAY, 'InvalidJWTToken');
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

        request.session!.user.id = user.id;

        const sockets = SocketServer.sockets.filter((socket) => request.session && socket.id === request.session.socket);
        if (sockets.length) {
            SSORouter.debug(`Emitting to socket ${sockets[0].id}, session ${sockets[0].handshake.session.id}`);
            sockets[0].emit('SSO_LOGON_END', {
                data: user.sanitizedCopy,
                message: 'SSOSuccessful',
                state: 'success',
            });
        }

        return response.status(httpStatus.OK).send('<h2>You may now close this window.</h2>');
    }

    /**
     * Start the SSO process. Here we redirect the user to the SSO service and prepare for the callback
     * Params:
     *  scopes <optional>: A space-separated list of scope codes.
     */
    @BaseRouter.requestDecorator(BaseRouter.checkLogin)
    private static async SSOAuth(request: Request, response: Response): Promise<Response> {

        if (request.query.uuid) {
            // With a characterUUID provided in the request, we initiate the re-authorization process

            const character: Character | undefined = await Character.doQuery()
                .where('character.uuid = :uuid', {uuid: request.query.uuid})
                .andWhere('character.userId = :userId', {userId: request.session!.user.id})
                .getOne();

            if (character) {
                request.session!.uuid = character.uuid;
            }
        }

        // Generate a random string and set it as the state of the request, we will later verify the response of the
        // EVE SSO service using the saved state. This is to prevent Cross Site Request Forgery, see this link for details:
        // http://www.thread-safe.com/2014/05/the-correct-use-of-state-parameter-in.html
        request.session!.state = generateRandomString(15);

        const args = [
            'response_type=code',
            'redirect_uri=' + config.getProperty('redirect_uri'),
            'client_id=' + config.getProperty('client_ID'),
            'scope=' + request.query.scopes,
            'state=' + request.session!.state,
        ];
        const finalUrl = protocol + oauthHost + authorizePath + args.join('&');

        response.redirect(finalUrl);
        return response.send();
    }

    /**
     * Process the callback from the SSO service, create/update character information before proceeding to Authorization.
     * Params:
     *  code <required>: The authorization token that will be used to get a Character's access code later in the process.
     *  state <required>: The random string that was generated and sent with the request.
     */
    @BaseRouter.requestDecorator(BaseRouter.checkLogin)
    // If a request was somehow done without giving a state, then it probably didn't come from the SSO, possibly directly linked.
    @BaseRouter.requestDecorator(BaseRouter.checkQueryParameters, 'state')
    private static async SSOAuthCallback(request: Request, response: Response): Promise<Response> {

        // We're verifying the state returned by the EVE SSO service with the state saved earlier.
        if (request.session!.state !== request.query.state) {
            // State did not match the one we saved, possible XSRF.
            process.emitWarning(
                `Invalid state from /auth-callback request! Expected '${request.session!.state}' and got '${request.query.state}'.`,
            );
            return SSORouter.sendResponse(response, httpStatus.BAD_REQUEST, 'InvalidState');
        }
        delete request.session!.state;

        const authResponse = await SSORouter.doAuthRequest(SSORouter.getSSOAuthString(), request.query.code);

        if (!authResponse || authResponse.status !== httpStatus.OK) {
            return SSORouter.sendResponse(response, httpStatus.BAD_GATEWAY, 'SSOTokenResponseError');
        }

        const token = jwt.decode(authResponse.data.access_token) as IJWTToken;
        if (!SSORouter.isJWTValid(token)) {
            return SSORouter.sendResponse(response, httpStatus.BAD_GATEWAY, 'InvalidJWTToken');
        }

        const {characterID, characterName, characterOwnerHash, characterScopes} = SSORouter.extractJWTValues(token);

        let user: User | undefined = await User.doQuery()
            .leftJoinAndSelect('user.characters', 'character')
            .where('user.id = :id', {id: request.session!.user.id})
            .getOne();

        if (!user) {
            return SSORouter.sendResponse(response, httpStatus.NOT_FOUND, 'UserNotFound');
        }

        let character = await Character.doQuery()
            .innerJoinAndSelect('character.user', 'user')
            .where('character.characterId = :characterID', {characterID})
            .getOne();

        if (character) {
            // Revoke old tokens
            if (character.accessToken) {
                SSORouter.revokeKey(character.accessToken, 'access_token').then();
            }
            if (character.refreshToken) {
                SSORouter.revokeKey(character.refreshToken, 'refresh_token').then();
            }
        }

        if (character && character.ownerHash !== characterOwnerHash) {
            // Character exists but has been transferred, delete the old one and create anew.
            await character.remove();
            character = undefined;
        }

        if (character && character.user.id !== request.session!.user.id) {
            // Merge Users

            // Move Characters to new User
            await Character.doQuery()
                .update()
                .set({user})
                .where('character.userId = :userId', {userId: character.user.id})
                .execute();
            await character.reload();

            // Copy relevant information from the old User to the new User.
            await User.doQuery()
                .update()
                .set({
                    email: character.user.email || user.email,
                    isAdmin: character.user.isAdmin || user.isAdmin,
                })
                .where('user.id = :id', {id: request.session!.user.id})
                .execute();

            // Delete the old User
            User.delete(character.user.id).then();
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
        character.scopes = characterScopes.join(' ');
        character.ownerHash = characterOwnerHash;
        character.user = user;

        await character.save();

        // Remove the characterUUID from the session as it is no longer needed
        delete request.session!.characterUUID;

        // Refresh user data.
        user = await User.doQuery()
            .leftJoinAndSelect('user.characters', 'character')
            .where('user.id = :id', {id: request.session!.user.id})
            .getOne();

        const sockets = SocketServer.sockets.filter((socket) => request.session && socket.id === request.session.socket);
        if (sockets.length) {
            SSORouter.debug(`Emitting to socket ${sockets[0].id}, session ${sockets[0].handshake.session.id}`);
            sockets[0].emit('SSO_AUTH_END', {
                data: {user: user!.sanitizedCopy, newCharacter: character.uuid},
                message: 'SSOSuccessful',
                state: 'success',
            });
        }

        return response.status(httpStatus.OK).send('<h2>You may now close this window.</h2>');
    }

    /**
     * Refresh the access token by requesting a new one using the refresh token
     * Params:
     *  characterUUID <required>: The UUID of the Character who's token to refresh
     *  accessToken <required>: The Character's current access token
     */
    @BaseRouter.requestDecorator(BaseRouter.checkLogin)
    @BaseRouter.requestDecorator(BaseRouter.checkQueryParameters, 'uuid')
    private static async refreshToken(request: Request, response: Response): Promise<Response> {

        // Fetch the Character who's accessToken we will refresh.
        const character = await Character.doQuery()
            .where('character.uuid = :uuid', {uuid: request.query.uuid})
            .getOne();

        if (!character || !character.refreshToken) {
            // There was no Character found with a matching UUID and userId.
            return SSORouter.sendResponse(response, httpStatus.NOT_FOUND, 'CharacterNotFound');
        }

        const refreshResponse = await SSORouter.doAuthRequest(SSORouter.getSSOAuthString(), character.refreshToken, true);

        if (!refreshResponse || refreshResponse.status !== httpStatus.OK) {
            return SSORouter.sendResponse(response, httpStatus.BAD_GATEWAY, 'SSOTokenResponseError');
        }

        character.refreshToken = refreshResponse.data.refresh_token;
        character.accessToken = refreshResponse.data.access_token;
        character.tokenExpiry = new Date(Date.now() + (refreshResponse.data.expires_in * 1000));
        await character.save();

        return SSORouter.sendResponse(response, httpStatus.OK, 'TokenRefreshed', {
            token: refreshResponse.data.access_token,
        });
    }

    /**
     * Delete a character
     * Params:
     *  characterUUID <required>: The UUID of the Character to delete
     */
    @BaseRouter.requestDecorator(BaseRouter.checkLogin)
    @BaseRouter.requestDecorator(BaseRouter.checkBodyParameters, 'characterUUID')
    private static async deleteCharacter(request: Request, response: Response): Promise<Response> {

        const user: User | undefined = await User.doQuery()
            .select(['user.id'])
            .leftJoinAndSelect('user.characters', 'character')
            .where('user.id = :id', {id: request.session!.user.id})
            .getOne();

        if (!user) {
            // Missing parameters
            return SSORouter.sendResponse(response, httpStatus.NOT_FOUND, 'UserNotFound');
        }

        const characterToDeleteList = user.characters.filter((_) => _.uuid === request.body.characterUUID);

        if (characterToDeleteList.length === 0) {
            // That character does not exist
            return SSORouter.sendResponse(response, httpStatus.NOT_FOUND, 'NoCharacterFound');
        }

        const characterToDelete = characterToDeleteList[0];

        // Revoke tokens
        if (characterToDelete.accessToken) {
            SSORouter.revokeKey(characterToDelete.accessToken, 'access_token').then();
        }
        if (characterToDelete.refreshToken) {
            SSORouter.revokeKey(characterToDelete.refreshToken, 'refresh_token').then();
        }

        await characterToDelete.remove();
        return SSORouter.sendResponse(response, httpStatus.OK, 'CharacterDeleted');
    }

    /**
     * Activate a character
     * Params:
     *  characterUUID <required>: The UUID of the Character to set as active
     */
    @BaseRouter.requestDecorator(BaseRouter.checkLogin)
    private static async activateCharacter(request: Request, response: Response): Promise<Response> {

        await Character.doQuery()
            .update(Character)
            .set({isActive: false})
            .where('character.userId = :id', {id: request.session!.user.id})
            .execute();

        const characterUUID = request.body.characterUUID;

        if (!characterUUID) {
            return SSORouter.sendResponse(response, httpStatus.OK, 'AllCharactersDeactivated');
        }

        const character = await Character.doQuery()
            .select(['character.id', 'character.isActive', 'character.uuid', 'character.userId'])
            .where('character.userId = :id', {id: request.session!.user.id})
            .andWhere('character.uuid = :uuid', {uuid: characterUUID})
            .getOne();

        if (!character) {
            return SSORouter.sendResponse(response, httpStatus.NOT_FOUND, 'NoCharacterFound');
        }

        character.isActive = true;
        await character.save();
        return SSORouter.sendResponse(response, httpStatus.OK, 'CharacterActivated');
    }

    private static async logDeprecation(request: Request, response: Response): Promise<Response> {

        const route = request.body.route as string;
        const text = request.body.text as string;
        esiService.logWarning(route, text);

        return SSORouter.sendResponse(response, httpStatus.OK, 'Logged');
    }

    /**
     * Get a base64 string containing the client ID and secret key for SSO login.
     */
    private static getSSOLoginString() {
        return Buffer.from(`${config.getProperty('SSO_login_client_ID')}:${config.getProperty('SSO_login_secret')}`).toString('base64');
    }

    /**
     * Get a base64 string containing the client ID and secret key for SSO auth.
     */
    private static getSSOAuthString() {
        return Buffer.from(`${config.getProperty('client_ID')}:${config.getProperty('secret_key')}`).toString('base64');
    }

    private static extractJWTValues(token: IJWTToken):
        { characterID: number, characterName: string, characterOwnerHash: string, characterScopes: string[] } {
        const characterID = Number(token.sub.split(':')[2]);
        const characterName = token.name;
        const characterOwnerHash = token.owner;
        const characterScopes = typeof token.scp === 'string' ? [token.scp] : token.scp;

        return {characterID, characterName, characterOwnerHash, characterScopes};
    }

    private static isJWTValid(token: IJWTToken): boolean {
        const clientIds = [config.getProperty('SSO_login_client_ID'), config.getProperty('client_ID')];
        if (!clientIds.includes(token.azp)) {
            // Authorized party is not correct.
            process.emitWarning('Authorized party is not correct.', `Expected: ${clientIds}, got: ${token.azp}`);
            return false;
        }

        if (![oauthHost, protocol + oauthHost].includes(token.iss)) {
            // Token issuer is incorrect.
            process.emitWarning('Unknown token issuer.', `Expected: '${oauthHost}' or '${protocol + oauthHost}', got: '${token.iss}'`);
            return false;
        }

        if (Date.now() > (token.exp * 1000)) {
            // Check if token is still valid.
            process.emitWarning('Token is expired.', `Expiry was ${((token.exp * 1000) - Date.now()) / 1000}s ago.`);
            return false;
        }

        return true;
    }

    private static doAuthRequest(auth: string, code: string, refresh = false) {
        const requestOptions: AxiosRequestConfig = {
            headers: {
                'Authorization': 'Basic ' + auth,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        };

        const requestBody = refresh ?
            new URLSearchParams({grant_type: 'refresh_token', refresh_token: code}) :
            new URLSearchParams({grant_type: 'authorization_code', code});

        const authUrl = `${protocol}${oauthHost}${tokenPath}`;
        SSORouter.debug(`Requesting authorization: ${code} (refresh: ${refresh})`);
        return axiosInstance.post<IAuthResponseData>(authUrl, requestBody, requestOptions).catch((error: AxiosError) => {
            Sentry.captureException(error);
            process.stderr.write(`Request failed: ${authUrl}\n${error.message}\n`);
            return;
        });
    }

    private static revokeKey(key: string, keyType: 'access_token' | 'refresh_token') {
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
            Sentry.captureException(error);
            process.stderr.write(`Request failed: ${revokeUrl}\n${error.message}\n`);
            return;
        });
    }

    constructor() {
        super();
        this.createGetRoute('/refresh', SSORouter.refreshToken);
        this.createPostRoute('/delete', SSORouter.deleteCharacter);
        this.createPostRoute('/activate', SSORouter.activateCharacter);
        this.createPostRoute('/log-route-warning', SSORouter.logDeprecation);

        // SSO login
        this.createGetRoute('/login', SSORouter.SSOLogin);
        this.createGetRoute('/login-callback', SSORouter.SSOLoginCallback);

        // SSO character auth
        this.createGetRoute('/auth', SSORouter.SSOAuth);
        this.createGetRoute('/auth-callback', SSORouter.SSOAuthCallback);
    }
}
