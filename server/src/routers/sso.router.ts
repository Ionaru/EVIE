import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { Request, Response } from 'express';
import * as httpStatus from 'http-status-codes';
import { logger } from 'winston-pnp-logger';

import { Calc } from '../../../client/src/shared/calc.helper';
import { config } from '../controllers/configuration.controller';
import { DataController } from '../controllers/data.controller';
import { SocketServer } from '../controllers/socket.controller';
import { Character } from '../models/character.model';
import { User } from '../models/user.model';
import { BaseRouter } from './base.router';

const scopes = [
    // 'esi-location.read_location.v1',
    'esi-location.read_ship_type.v1',
    // 'esi-industry.read_character_jobs.v1',
    'esi-markets.read_character_orders.v1',
    'esi-skills.read_skills.v1',
    'esi-skills.read_skillqueue.v1',
    'esi-wallet.read_character_wallet.v1',
];
const protocol = 'https://';
const oauthHost = 'login.eveonline.com';
const oauthPath = '/oauth/authorize?';
const tokenPath = '/oauth/token?';
const verifyPath = '/oauth/verify?';

export class SSORouter extends BaseRouter {

    private static async loginThroughSSO(request: Request, response: Response): Promise<Response> {
        // Generate a random string and set it as the state of the request, we will later verify the response of the
        // EVE SSO service using the saved state. This is to prevent Cross Site Request Forgery (XSRF), see this link for details:
        // http://www.thread-safe.com/2014/05/the-correct-use-of-state-parameter-in.html
        request.session!.state = Calc.generateRandomString(15);
        const args = [
            'response_type=code',
            'redirect_uri=' + config.getProperty('SSO_login_redirect_uri'),
            'client_id=' + config.getProperty('SSO_login_client_ID'),
            'state=' + request.session!.state,
        ];
        const finalUrl = 'https://' + oauthHost + oauthPath + args.join('&');

        response.redirect(finalUrl);
        return response.send();
    }

    private static async loginThroughSSOCallback(request: Request, response: Response): Promise<Response> {
        if (!request.query.state) {
            // Somehow a request was done without giving a state, probably didn't come from the SSO, possibly directly linked.
            return SSORouter.sendResponse(response, httpStatus.BAD_REQUEST, 'BadCallback');
        }

        // We're verifying the state returned by the EVE SSO service with the state saved earlier.
        if (request.session!.state !== request.query.state) {
            // State did not match the one we saved, possible XSRF.
            logger.warn(`Invalid state from /callback request! Expected '${request.session!.state}' and got '${request.query.state}'.`);
            return SSORouter.sendResponse(response, httpStatus.BAD_REQUEST, 'InvalidState');
        }

        // The state has been verified and served its purpose, delete it.
        delete request.session!.state;

        const requestOptions: AxiosRequestConfig = {
            headers: {
                'Authorization': `Basic ${SSORouter.getSSOLoginString()}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        };

        const requestArgs = [
            'grant_type=authorization_code',
            `code=${request.query.code}`,
        ];

        const authUrl = `${protocol}${oauthHost}${tokenPath}${requestArgs.join('&')}`;
        logger.debug(authUrl);
        const authResponse = await axios.post<IAuthResponseData>(authUrl, null, requestOptions).catch((error: AxiosError) => {
            logger.error('Request failed:', authUrl, error.message);
            return;
        });

        if (!authResponse || authResponse.status !== httpStatus.OK) {
            return SSORouter.sendResponse(response, httpStatus.BAD_GATEWAY, 'SSOResponseError');
        }

        const verifyRequestConfig: AxiosRequestConfig = {
            headers: {
                authorization: 'Bearer ' + authResponse.data.access_token,
            },
        };

        const verifyUrl = protocol + oauthHost + verifyPath;
        logger.debug(verifyUrl);
        const verifyResult = await axios.get<IVerifyResponseData>(verifyUrl, verifyRequestConfig).catch((error: AxiosError) => {
            logger.error('Request failed:', verifyUrl, error.message);
            return;
        });

        if (!verifyResult || verifyResult.status !== httpStatus.OK) {
            return SSORouter.sendResponse(response, httpStatus.BAD_GATEWAY, 'SSOResponseError');
        }

        const characterSubQuery = Character.doQuery()
            .select('character.user')
            .where('character.ownerHash = :ownerHash', {ownerHash: verifyResult.data.CharacterOwnerHash});

        let user: User | undefined = await User.doQuery()
            .leftJoinAndSelect('user.characters', 'character')
            .where(`user.id IN (${characterSubQuery.getQuery()})`)
            .setParameters(characterSubQuery.getParameters())
            .getOne();

        if (!user) {
            user = new User();
            await user.save();
        }

        request.session!.user.id = user.id;

        const sockets = SocketServer.sockets.filter((socket) => request.session && socket.id === request.session.socket);
        if (sockets.length) {
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
     *  characterUUID <optional>: The UUID of the Character to re-authorize, this is useful for scope updates and characters
     *                           that revoked access for this app.
     *                           If this is not provided, a new Character will be created
     */
    @BaseRouter.requestDecorator(BaseRouter.checkLogin)
    private static async startSSOProcess(request: Request, response: Response): Promise<Response> {

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
        request.session!.state = Calc.generateRandomString(15);

        const args = [
            'response_type=code',
            'redirect_uri=' + config.getProperty('redirect_uri'),
            'client_id=' + config.getProperty('client_ID'),
            'scope=' + scopes.join(' '),
            'state=' + request.session!.state,
        ];
        const finalUrl = 'https://' + oauthHost + oauthPath + args.join('&');

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
    private static async processCallBack(request: Request, response: Response): Promise<Response> {

        if (!request.query.state) {
            // Somehow a request was done without giving a state, probably didn't come from the SSO, possibly directly linked.
            return SSORouter.sendResponse(response, httpStatus.BAD_REQUEST, 'BadCallback');
        }

        // We're verifying the state returned by the EVE SSO service with the state saved earlier.
        if (request.session!.state !== request.query.state) {
            // State did not match the one we saved, possible XSRF.
            logger.warn(`Invalid state from /callback request! Expected '${request.session!.state}' and got '${request.query.state}'.`);
            return SSORouter.sendResponse(response, httpStatus.BAD_REQUEST, 'InvalidState');
        }

        // The state has been verified and served its purpose, delete it.
        delete request.session!.state;

        const requestOptions: AxiosRequestConfig = {
            headers: {
                'Authorization': `Basic ${SSORouter.getSSOAuthString()}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        };

        const requestArgs = [
            'grant_type=authorization_code',
            `code=${request.query.code}`,
        ];

        const authUrl = `${protocol}${oauthHost}${tokenPath}${requestArgs.join('&')}`;
        logger.debug(authUrl);
        const authResponse = await axios.post<IAuthResponseData>(authUrl, null, requestOptions).catch((error: AxiosError) => {
            logger.error('Request failed:', authUrl, error.message);
            return;
        });

        if (!authResponse || authResponse.status !== httpStatus.OK) {
            return SSORouter.sendResponse(response, httpStatus.BAD_GATEWAY, 'SSOResponseError');
        }

        const verifyRequestConfig: AxiosRequestConfig = {
            headers: {
                authorization: 'Bearer ' + authResponse.data.access_token,
            },
        };

        const verifyUrl = protocol + oauthHost + verifyPath;
        logger.debug(verifyUrl);
        const verifyResponse = await axios.get<IVerifyResponseData>(verifyUrl, verifyRequestConfig).catch((error: AxiosError) => {
            logger.error('Request failed:', verifyUrl, error.message);
            return;
        });

        if (!verifyResponse || verifyResponse.status !== httpStatus.OK) {
            return SSORouter.sendResponse(response, httpStatus.BAD_GATEWAY, 'SSOResponseError');
        }

        const user: User | undefined = await User.doQuery()
            .leftJoinAndSelect('user.characters', 'character')
            .where('user.id = :id', {id: request.session!.user.id})
            .getOne();

        if (!user) {
            return SSORouter.sendResponse(response, httpStatus.NOT_FOUND, 'UserNotFound');
        }

        let character = await Character.doQuery()
            .innerJoinAndSelect('character.user', 'user')
            .where('character.characterId = :characterId', {characterId: verifyResponse.data.CharacterID})
            .getOne();

        if (character && character.ownerHash !== verifyResponse.data.CharacterOwnerHash) {
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
        character.name = verifyResponse.data.CharacterName;
        character.characterId = verifyResponse.data.CharacterID;
        character.scopes = verifyResponse.data.Scopes;
        character.ownerHash = verifyResponse.data.CharacterOwnerHash;
        character.user = user;

        await character.save();

        // Remove the characterUUID from the session as it is no longer needed
        delete request.session!.characterUUID;

        const u: User | undefined = await User.doQuery()
            .leftJoinAndSelect('user.characters', 'character')
            .where('user.id = :id', {id: request.session!.user.id})
            .getOne();

        const sockets = SocketServer.sockets.filter((socket) => request.session && socket.id === request.session.socket);
        if (sockets.length) {
            sockets[0].emit('SSO_AUTH_END', {
                data: u!.sanitizedCopy,
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

        if (!character) {
            // There was no Character found with a matching UUID and userId.
            return SSORouter.sendResponse(response, httpStatus.NOT_FOUND, 'CharacterNotFound');
        }

        const requestOptions: AxiosRequestConfig = {
            headers: {
                'Authorization': 'Basic ' + SSORouter.getSSOAuthString(),
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        };

        const refreshUrl = protocol + oauthHost + tokenPath;
        const data = `grant_type=refresh_token&refresh_token=${character.refreshToken}`;
        logger.debug(refreshUrl);
        const refreshResponse = await axios.post(refreshUrl, data, requestOptions).catch((error: AxiosError) => {
            logger.error('Request failed:', refreshUrl, error.message);
            return;
        });

        if (!refreshResponse || refreshResponse.status !== httpStatus.OK) {
            return SSORouter.sendResponse(response, httpStatus.BAD_GATEWAY, 'SSOResponseError');
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
        DataController.logWarning(route, text);

        return SSORouter.sendResponse(response, httpStatus.OK, 'Logged');
    }

    /**
     * Get a base64 string containing the client ID and secret key for SSO login.
     */
    private static getSSOLoginString() {
        return new Buffer(`${config.getProperty('SSO_login_client_ID')}:${config.getProperty('SSO_login_secret')}`).toString('base64');
    }

    /**
     * Get a base64 string containing the client ID and secret key for SSO auth.
     */
    private static getSSOAuthString() {
        return new Buffer(`${config.getProperty('client_ID')}:${config.getProperty('secret_key')}`).toString('base64');
    }

    constructor() {
        super();
        this.createGetRoute('/refresh', SSORouter.refreshToken);
        this.createPostRoute('/delete', SSORouter.deleteCharacter);
        this.createPostRoute('/activate', SSORouter.activateCharacter);
        this.createPostRoute('/log-route-warning', SSORouter.logDeprecation);

        // SSO login
        this.createGetRoute('/login', SSORouter.loginThroughSSO);
        this.createGetRoute('/login-callback', SSORouter.loginThroughSSOCallback);

        // SSO character auth
        this.createGetRoute('/auth', SSORouter.startSSOProcess);
        this.createGetRoute('/auth-callback', SSORouter.processCallBack);
    }
}
