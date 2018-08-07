import { Request, Response } from 'express';
import fetch from 'node-fetch';
import { logger } from 'winston-pnp-logger';

import { config } from '../controllers/configuration.controller';
import { DataController } from '../controllers/data.controller';
import { generateRandomString } from '../controllers/random.controller';
import { SocketServer } from '../controllers/socket.controller';
import { Character } from '../models/character.model';
import { User } from '../models/user.model';
import { BaseRouter } from './base.router';

const scopes = [
    'characterWalletRead',
    'characterAccountRead',
    'esi-location.read_location.v1',
    'esi-location.read_ship_type.v1',
    'esi-wallet.read_character_wallet.v1',
    'esi-markets.read_character_orders.v1',
    'esi-skills.read_skills.v1',
    'esi-skills.read_skillqueue.v1',
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
    private static async startSSOProcess(request: Request, response: Response): Promise<Response> {

        if (!request.session || !request.session.user.id) {
            // User is not logged in and can't initiate SSO process
            return SSORouter.sendResponse(response, 401, 'NotLoggedIn');
        }

        if (request.query.uuid) {
            // With a characterUUID provided in the request, we initiate the re-authorization process

            const character: Character | undefined = await Character.doQuery()
                .where('character.uuid = :uuid', {uuid: request.query.uuid})
                .andWhere('character.userId = :userId', {userId: request.session.user.id})
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
    private static async processCallBack(request: Request, response: Response): Promise<Response> {

        if (!request.session || !request.session.user.id) {
            // User is not logged in and can't initiate SSO callback.
            // This route should only be called right after the SSO start, so this shouldn't be possible unless the client
            // was linked directly to this page.
            return SSORouter.sendResponse(response, 401, 'NotLoggedIn');
        }

        if (!request.query.state) {
            // Somehow a request was done without giving a state, probably didn't come from the SSO, possibly directly linked.
            return SSORouter.sendResponse(response, 400, 'BadCallback');
        }

        // We're verifying the state returned by the EVE SSO service with the state saved earlier.
        if (request.session!.state !== request.query.state) {
            // State did not match the one we saved, possible XSRF.
            logger.warn(`Invalid state from /callback request! Expected '${request.session!.state}' and got '${request.query.state}'.`);
            return SSORouter.sendResponse(response, 400, 'InvalidState');
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
                return SSORouter.sendResponse(response, 404, 'UserNotFound');
            }

            // Create a new character
            character = new Character();
            character.user = user;
        }

        const requestOptions = {
            headers: {
                'Authorization': 'Basic ' + SSORouter.getSSOAuthString(),
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            method: 'POST',
        };

        const requestArgs = [
            'grant_type=authorization_code',
            `code=${request.query.code}`,
        ];

        const authUrl = protocol + oauthHost + tokenPath + requestArgs.join('&');
        logger.debug(authUrl);
        const authResponse = await fetch(authUrl, requestOptions).catch((errorResponse) => errorResponse);

        if (!authResponse.ok) {
            return SSORouter.sendResponse(response, 502, 'SSOResponseError');
        }

        const authResponseData: IAuthResponseData | undefined = await authResponse.json().catch(() => {
            return undefined;
        });

        if (!authResponseData) {
            return SSORouter.sendResponse(response, 502, 'SSOResponseError');
        }

        character.accessToken = authResponseData.access_token;
        character.refreshToken = authResponseData.refresh_token;
        character.tokenExpiry = new Date(Date.now() + (authResponseData.expires_in * 1000));

        const characterIdRequestOptions = {
            headers: {
                'Authorization': 'Bearer ' + authResponseData.access_token,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            host: oauthHost,
            path: '',
        };

        const verifyUrl = protocol + oauthHost + verifyPath;
        logger.debug(verifyUrl);
        const characterIdResult = await fetch(verifyUrl, characterIdRequestOptions).catch((errorResponse) => errorResponse);

        if (!characterIdResult.ok) {
            return SSORouter.sendResponse(response, 502, 'SSOResponseError');
        }

        const charData: IVerifyResponseData | undefined = await characterIdResult.json().catch(() => undefined);

        if (!charData) {
            return SSORouter.sendResponse(response, 502, 'SSOResponseError');
        }

        character.name = charData.CharacterName;
        character.characterId = charData.CharacterID;
        character.scopes = charData.Scopes;
        character.ownerHash = charData.CharacterOwnerHash;

        await character.save();

        // Remove the characterUUID from the session as it is no longer needed
        delete request.session!.characterUUID;

        const socket: ISessionSocket | undefined = SocketServer.sockets.filter((_) => _.id === request.session!.socket)[0];
        if (socket) {
            socket.emit('SSO_END', {
                data: character.sanitizedCopy,
                message: 'SSOSuccessful',
                state: 'success',
            });
        }

        return response.status(200).send('<h2>You may now close this window.</h2>');
    }

    /**
     * Refresh the access token by requesting a new one using the refresh token
     * Params:
     *  characterUUID <required>: The UUID of the Character who's token to refresh
     *  accessToken <required>: The Character's current access token
     */
    private static async refreshToken(request: Request, response: Response): Promise<Response> {

        if (!request.session || !request.session.user.id) {
            // User is not logged in and can't refresh any API token.
            return SSORouter.sendResponse(response, 401, 'NotLoggedIn');
        }

        // Get the characterUUID from the request
        const characterUUID = request.query.uuid;

        if (!characterUUID) {
            // Missing parameters
            return SSORouter.sendResponse(response, 400, 'MissingParameters');
        }

        // Fetch the Character who's accessToken we will refresh.
        const character = await Character.doQuery()
            .where('character.userId = :id', {id: request.session!.user.id})
            .andWhere('character.uuid = :uuid', {uuid: characterUUID})
            .getOne();

        if (!character) {
            // There was no Character found with a matching UUID and userId.
            return SSORouter.sendResponse(response, 404, 'CharacterNotFound');
        }

        const requestOptions = {
            body: `grant_type=refresh_token&refresh_token=${character.refreshToken}`,
            headers: {
                'Authorization': 'Basic ' + SSORouter.getSSOAuthString(),
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            method: 'POST',
        };

        const refreshUrl = protocol + oauthHost + tokenPath;
        logger.debug(refreshUrl);
        const refreshResponse = await fetch(refreshUrl, requestOptions).catch((errorResponse) => errorResponse);

        if (!refreshResponse.ok) {
            return SSORouter.sendResponse(response, 502, 'SSOResponseError');
        }

        const refreshResult = await refreshResponse.json().catch(() => undefined);

        if (!refreshResult) {
            return SSORouter.sendResponse(response, 502, 'SSOResponseError');
        }

        character.refreshToken = refreshResult.refresh_token;
        character.accessToken = refreshResult.access_token;
        character.tokenExpiry = new Date(Date.now() + (refreshResult.expires_in * 1000));
        await character.save();

        return SSORouter.sendResponse(response, 200, 'TokenRefreshed', {
            token: refreshResult.access_token,
        });
    }

    /**
     * Delete a character
     * Params:
     *  characterUUID <required>: The UUID of the Character to delete
     */
    private static async deleteCharacter(request: Request, response: Response): Promise<Response> {

        if (!request.session || !request.session.user.id) {
            // User is not logged in and can't initiate SSO process
            return SSORouter.sendResponse(response, 401, 'NotLoggedIn');
        }

        const characterUUID = request.body.characterUUID;

        if (!characterUUID) {
            // Missing parameters
            return SSORouter.sendResponse(response, 400, 'MissingParameters');
        }

        const user: User | undefined = await User.doQuery()
            .select(['user.id', 'user.email', 'user.uuid', 'user.username', 'user.timesLogin', 'user.lastLogin'])
            .leftJoinAndSelect('user.characters', 'character')
            .where('user.id = :id', {id: request.session!.user.id})
            .getOne();

        if (!user) {
            // Missing parameters
            return SSORouter.sendResponse(response, 404, 'UserNotFound');
        }

        const characters = user.characters;

        const characterToDeleteList = characters.filter((_) => _.uuid === characterUUID);

        if (characterToDeleteList.length === 0) {
            // That character does not exist
            return SSORouter.sendResponse(response, 404, 'NoCharacterFound');
        }

        const characterToDelete = characterToDeleteList[0];

        await characterToDelete.remove();
        return SSORouter.sendResponse(response, 200, 'CharacterDeleted');
    }

    /**
     * Activate a character
     * Params:
     *  characterUUID <required>: The UUID of the Character to set as active
     */
    private static async activateCharacter(request: Request, response: Response): Promise<Response> {

        if (!request.session || !request.session.user.id) {
            return SSORouter.sendResponse(response, 401, 'NotLoggedIn');
        }

        await Character.doQuery()
            .update(Character)
            .set({isActive: false})
            .where('character.userId = :id', {id: request.session!.user.id})
            .execute();

        const characterUUID = request.body.characterUUID;

        if (!characterUUID) {
            return SSORouter.sendResponse(response, 200, 'AllCharactersDeactivated');
        }

        const character = await Character.doQuery()
            .select(['character.id', 'character.isActive', 'character.uuid', 'character.userId'])
            .where('character.userId = :id', {id: request.session!.user.id})
            .andWhere('character.uuid = :uuid', {uuid: characterUUID})
            .getOne();

        if (!character) {
            return SSORouter.sendResponse(response, 404, 'NoCharacterFound');
        }

        character.isActive = true;
        await character.save();
        return SSORouter.sendResponse(response, 200, 'CharacterActivated');
    }

    private static async logDeprecation(request: Request, response: Response): Promise<Response> {

        const route = request.body.route as string;
        const text = request.body.text as string;
        DataController.logDeprecation(route, text);

        return SSORouter.sendResponse(response, 200, 'Logged');
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
