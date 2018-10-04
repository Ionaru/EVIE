import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { Request, Response } from 'express';
import * as httpStatus from 'http-status-codes';
import { logger } from 'winston-pnp-logger';

import { config } from '../controllers/configuration.controller';
import { DataController } from '../controllers/data.controller';
import { generateRandomString } from '../controllers/random.controller';
import { SocketServer } from '../controllers/socket.controller';
import { Character } from '../models/character.model';
import { User } from '../models/user.model';
import { BaseRouter } from './base.router';

const scopes = [
    'esi-location.read_location.v1',
    'esi-location.read_ship_type.v1',
    'esi-industry.read_character_jobs.v1',
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
        request.session!.state = generateRandomString(15);

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

        let character: Character | undefined;

        if (request.session!.characterUUID) {
            character = await Character.doQuery()
                .where('character.uuid = :uuid', {uuid: request.session!.characterUUID})
                .getOne();
        }

        if (!character) {
            const user: User | undefined = await User.doQuery()
                .where('user.id = :id', {id: request.session!.user.id})
                .getOne();

            if (!user) {
                return SSORouter.sendResponse(response, httpStatus.NOT_FOUND, 'UserNotFound');
            }

            // Create a new character
            character = new Character();
            character.user = user;
        }

        const requestOptions: AxiosRequestConfig = {
            headers: {
                'Authorization': 'Basic ' + SSORouter.getSSOAuthString(),
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
            logger.error('Request failed:', authUrl, error);
            return;
        });

        if (!authResponse || authResponse.status !== httpStatus.OK) {
            return SSORouter.sendResponse(response, httpStatus.BAD_GATEWAY, 'SSOResponseError');
        }

        character.accessToken = authResponse.data.access_token;
        character.refreshToken = authResponse.data.refresh_token;
        character.tokenExpiry = new Date(Date.now() + (authResponse.data.expires_in * 1000));

        const verifyRequestConfig: AxiosRequestConfig = {
            headers: {
                authorization: 'Bearer ' + authResponse.data.access_token,
            },
        };

        const verifyUrl = protocol + oauthHost + verifyPath;
        logger.debug(verifyUrl);
        const verifyResult = await axios.get<IVerifyResponseData>(verifyUrl, verifyRequestConfig).catch((error: AxiosError) => {
            logger.error('Request failed:', verifyUrl, error);
            return;
        });

        if (!verifyResult || verifyResult.status !== httpStatus.OK) {
            return SSORouter.sendResponse(response, httpStatus.BAD_GATEWAY, 'SSOResponseError');
        }

        character.name = verifyResult.data.CharacterName;
        character.characterId = verifyResult.data.CharacterID;
        character.scopes = verifyResult.data.Scopes;
        character.ownerHash = verifyResult.data.CharacterOwnerHash;

        await character.save();

        // Remove the characterUUID from the session as it is no longer needed
        delete request.session!.characterUUID;

        const sockets = SocketServer.sockets.filter((_) => request.session && _.id === request.session.socket);

        if (sockets.length) {
            sockets[0].emit('SSO_END', {
                data: character.sanitizedCopy,
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
            .where('character.userId = :id', {id: request.session!.user.id})
            .andWhere('character.uuid = :uuid', {uuid: request.query.uuid})
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
            logger.error('Request failed:', refreshUrl, error);
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
            .select(['user.id', 'user.email', 'user.uuid', 'user.username', 'user.timesLogin', 'user.lastLogin'])
            .leftJoinAndSelect('user.characters', 'character')
            .where('user.id = :id', {id: request.session!.user.id})
            .getOne();

        if (!user) {
            // Missing parameters
            return SSORouter.sendResponse(response, httpStatus.NOT_FOUND, 'UserNotFound');
        }

        const characters = user.characters;

        const characterToDeleteList = characters.filter((_) => _.uuid === request.body.characterUUID);

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
     * Get a base64 string containing the client ID and secret key
     */
    private static getSSOAuthString(): string {
        return new Buffer(config.getProperty('client_ID') + ':' + config.getProperty('secret_key')).toString('base64');
    }

    constructor() {
        super();
        this.createGetRoute('/start', SSORouter.startSSOProcess);
        this.createGetRoute('/callback', SSORouter.processCallBack);
        this.createGetRoute('/refresh', SSORouter.refreshToken);
        this.createPostRoute('/delete', SSORouter.deleteCharacter);
        this.createPostRoute('/activate', SSORouter.activateCharacter);
        this.createPostRoute('/log-route-warning', SSORouter.logDeprecation);
    }
}
