import https = require('https');
import fetch from 'node-fetch';

import { Response, Request } from 'express';
import { logger } from '../services/logger.service';
import { BaseRouter, sendResponse, sendTextResponse } from './base.router';
import { ssoConfig } from '../services/config.service';
import { Character, CharacterInstance } from '../models/character/character';
import { generateUniquePID, generateRandomString } from '../services/pid.service';
import { sockets } from '../bin/www';
import { UserInstance, User } from '../models/user/user';

//noinspection SpellCheckingInspection
const scopes = [
  'characterWalletRead',
  'characterAccountRead',
  'esi-location.read_location.v1',
  'esi-location.read_ship_type.v1',
  'esi-wallet.read_character_wallet.v1',
  'esi-skills.read_skills.v1',
  'esi-skills.read_skillqueue.v1',
];
const protocol = 'https://';
const oauthHost = 'login.eveonline.com';
const oauthPath = '/oauth/authorize?';
const tokenPath = '/oauth/token?';
const verifyPath = '/oauth/verify?';

export class SSORouter extends BaseRouter {

  constructor() {
    super();
    this.createGetRoute('/start', SSORouter.startSSOProcess);
    this.createGetRoute('/callback', SSORouter.processCallBack);
    this.createGetRoute('/auth', SSORouter.authorizeToken);
    this.createGetRoute('/refresh', SSORouter.refreshToken);
    this.createPostRoute('/delete', SSORouter.deleteCharacter);
    this.createPostRoute('/activate', SSORouter.activateCharacter);
    logger.info('Route defined: SSO');
  }

  /**
   * Start the SSO process. Here we redirect the user to the SSO service and prepare for the callback
   * Params:
   *  characterPid <optional>: The Pid of the Character to re-authorize, this is useful for scope updates and characters
   *                           that revoked access for this app.
   *                           If this is not provided, a new Character will be created
   */
  private static async startSSOProcess(request: Request, response: Response): Promise<void> {

    if (!request.session['user']) {

      // User is not logged in and can't initiate SSO process
      sendResponse(response, 401, 'NotLoggedIn');

    } else {
      // User is logged in

      if (request.query.characterPid) {
        // With a characterPid provided in the request, we initiate the re-authorization process

        // Fetch the Character
        const character: CharacterInstance = await Character.findOne({
          attributes: ['pid'],
          where: {
            pid: request.query.characterPid,
            userId: request.session['user'].id,
          },
        });
        if (character) {
          request.session['characterPid'] = character.pid;
        }
      }

      // Generate a random string and set it as the state of the request, we will later verify the response of the
      // EVE SSO service using the saved state. This is to prevent Cross Site Request Forgery,
      // see: http://www.thread-safe.com/2014/05/the-correct-use-of-state-parameter-in.html
      request.session['state'] = generateRandomString(15);

      const args = [
        'response_type=code',
        'redirect_uri=' + ssoConfig.get('redirect_uri'),
        'client_id=' + ssoConfig.get('client_ID'),
        'scope=' + scopes.join(' '),
        'state=' + request.session['state'],
      ];
      const finalUrl = 'https://' + oauthHost + oauthPath + args.join('&');

      response.redirect(finalUrl);
    }
  }

  /**
   * Process the callback from the SSO service, create/update character information before proceeding to Authorization.
   * Params:
   *  code <required>: The authorization token that will be used to get a Character's access code later in the process.
   *  state <required>: The random string that was generated and sent with the request.
   */
  private static async processCallBack(request: Request, response: Response): Promise<void> {

    if (!request.session['user']) {
      // User is not logged in and can't initiate SSO callback.
      // This route should only be called right after the SSO start, so this shouldn't be possible unless the client
      // was linked directly to this page.
      sendResponse(response, 401, 'NotLoggedIn');
    } else {

      if (request.query.state && request.session['state'] === request.query.state) {
        // We're verifying the state returned by the EVE SSO service with the state saved earlier.

        // The state has been verified and served its purpose, delete it.
        delete request.session['state'];

        // Find a Character matching the characterPid saved in the session, create a new Character when none are found.
        const characters: CharacterInstance = await Character.findOrCreate({
          where: {
            pid: request.session['characterPid'] // May be undefined, a new Character is then created.
          },
          defaults: {
            pid: await generateUniquePID(10, Character),
            userId: request.session['user'].id,
          }
        });

        // The 'findOrCreate' function returns an array, the first element is the Character, the second is whether
        // a new Character was created or not. We only use the first element here.
        const character = characters[0];

        // Set the Characters authToken and clear the other fields for re-authorization.
        character.authToken = request.query.code;
        character.accessToken = null;
        character.tokenExpiry = null;
        character.refreshToken = null;
        await character.save();

        // The characterPid may have changed due to the creation of a new Character, save this new pid so we can use it
        // later.
        request.session['characterPid'] = character.pid;
        request.session.save(() => {
          // Redirect the user to the next step in the SSO process.
          response.redirect('/sso/auth');
        });

      } else {
        // The state got from the EVE SSO service did not match the one we expected.
        if (request.query.state) {
          logger.error(`Returned state was not valid, expected ${request.session['state']} 
                        and got ${request.query.state}`);
          sendResponse(response, 400, 'InvalidState');
        } else {
          sendResponse(response, 400, 'BadCallback');
        }
      }
    }
  }

  /**
   * Authorize the token gotten from the SSO service and get the character information.
   */
  private static async authorizeToken(request: Request, response: Response): Promise<void> {

    const socket = sockets.filter(_ => _.id === request.session['socket'])[0];

    // Fetch the Character matching the characterPid we saved in the session earlier.
    const character: CharacterInstance = await Character.findOne({
      attributes: ['id', 'pid', 'authToken', 'refreshToken'],
      where: {
        pid: request.session['characterPid']
      }
    });

    if (character && character.authToken) {
      // A character is found and the authToken column is filled.

      const postData = `grant_type=authorization_code&code=${character.authToken}`;

      const authRequestOptions = {
        host: oauthHost,
        path: tokenPath,
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + SSORouter.getSSOAuthString(),
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      };

      // TODO: Use a request module instead of this mess below

      const authRequest = https.request(authRequestOptions, (authResponse) => {
        const authResult = [];
        authResponse.on('data', (chunk: Buffer) => {
          authResult.push(JSON.parse(chunk.toString()));
        });
        authResponse.on('end', async () => {

          // Set the Character fields from the results
          character.refreshToken = authResult[0]['refresh_token'];
          character.accessToken = authResult[0]['access_token'];
          character.tokenExpiry = new Date(Date.now() + (authResult[0]['expires_in'] * 1000));

          // The authToken is no longer useful, remove it from the Character
          character.authToken = null;

          // Prepare a new request to fetch required Character data
          const characterIdRequestOptions = {
            host: oauthHost,
            path: verifyPath,
            headers: {
              'Authorization': 'Bearer ' + authResult[0]['access_token'],
              'Content-Type': 'application/x-www-form-urlencoded',
            }
          };

          const characterIdRequest = https.get(characterIdRequestOptions, (characterIdResponse) => {
            const characterIdResult = [];
            characterIdResponse.on('data', (chunk: Buffer) => {
              characterIdResult.push(JSON.parse(chunk.toString()));
            });
            characterIdResponse.on('end', async () => {

              // Set the Character fields from the results
              character.name = characterIdResult[0]['CharacterName'];
              character.characterId = characterIdResult[0]['CharacterID'];
              character.scopes = characterIdResult[0]['Scopes'];
              character.ownerHash = characterIdResult[0]['CharacterOwnerHash'];
              await character.save();

              const characterResponse = character.toJSON();

              // Delete sensitive and useless information from the response
              delete characterResponse.id;
              delete characterResponse.authToken;
              delete characterResponse.refreshToken;
              delete characterResponse['updatedAt'];

              // Remove the characterPid from the session as it is no longer needed
              delete request.session['characterPid'];

              socket.emit('SSO_END', {
                state: 'success',
                message: 'SSOSuccessful',
                data: characterResponse,
              });
              sendTextResponse(response, 200, '<h2>You may now close this window.</h2>');
            });
            characterIdResponse.on('error', (error) => {
              logger.error(error);
            });
            characterIdRequest.end();
          });
          authResponse.on('error', (error) => {
            logger.error(error);
          });
        });
        authRequest.on('error', (error) => {
          logger.error(error);
        });
      });

      authRequest.write(postData);
      authRequest.end();

    } else {
      // Either no Character was found matching the characterPid or the authToken column was NULL, either way we can't
      // authorize anything here.
      await socket.emit('SSO_END', {
        state: 'error',
        message: 'NothingToAuthorize',
      });
      sendResponse(response, 400, 'NothingToAuthorize');
    }
  }

  /**
   * Refresh the access token by requesting a new one using the refresh token
   * Params:
   *  characterPid <required>: The Pid of the Character who's token to refresh
   *  accessToken <required>: The Character's current access token
   */
  private static async refreshToken(request: Request, response: Response): Promise<void> {

    try {

      // Get the characterPid and accessToken from the request
      const characterPid = request.query.pid;
      const accessToken = request.query.accessToken;

      // Fetch the Character who's accessToken we will refresh
      const character: CharacterInstance = await Character.findOne({
        attributes: ['id', 'accessToken', 'refreshToken'],
        where: {
          pid: characterPid,
        }
      });

      if (character) {
        // A character was found in the database

        if (character.accessToken === accessToken) {
          // The Character's accessToken matches the one sent with the request

          const postData = `grant_type=refresh_token&refresh_token=${character.refreshToken}`;

          const requestOptions = {
            method: 'POST',
            headers: {
              'Authorization': 'Basic ' + SSORouter.getSSOAuthString(),
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: postData,
          };

          const refreshResponse = await fetch(protocol + oauthHost + tokenPath, requestOptions);
          const refreshResult = await refreshResponse.json();
          if (refreshResult.error) {
            logger.error(refreshResult);
            sendResponse(response, 500, 'RefreshAPIError');
            return;
          }
          character.refreshToken = refreshResult['refresh_token'];
          character.accessToken = refreshResult['access_token'];
          character.tokenExpiry = new Date(Date.now() + (refreshResult['expires_in'] * 1000));
          await character.save();
          sendResponse(response, 200, 'TokenRefreshed', {
            token: refreshResult['access_token']
          });

        } else {
          // The access token sent with the request did not match with the fetched Character
          sendResponse(response, 401, 'WrongAccessToken');
        }

      } else {
        // There was no Character found with the Pid provided in the request
        sendResponse(response, 404, 'CharacterNotFound');
      }

    } catch (error) {
      logger.error(error);
      sendResponse(response, 500, 'RefreshRequestError');
    }
  }

  /**
   * Delete a character
   * Params:
   *  characterPid <required>: The Pid of the Character to delete
   */
  private static async deleteCharacter(request: Request, response: Response): Promise<void> {

    if (request.session['user']) {

      const pid = request.body.characterPid;

      if (pid) {

        const user: UserInstance = await User.findOne({
          attributes: ['id'],
          where: {
            id: request.session['user'].id
          },
          include: [{
            model: Character,
            attributes: ['id', 'pid', 'userId'],
          }]
        });

        const characters = user.characters.map(function (character: CharacterInstance): Object {
          return character;
        });

        const characterToDeleteList = characters.filter(_ => _.pid === pid);

        if (characterToDeleteList.length > 0) {

          const characterToDelete = characterToDeleteList[0];

          if (user.id === characterToDelete.userId) {

            await characterToDelete.destroy();
            sendResponse(response, 200, 'CharacterDeleted');

          } else {

            // That character does not belong to the user who initiated the request
            sendResponse(response, 401, 'NotYourCharacter');
          }

        } else {

          // That character does not exist
          sendResponse(response, 404, 'NoCharacterFound');
        }

      } else {

        // Missing parameters
        sendResponse(response, 400, 'MissingParameters');
      }

    } else {

      // User is not logged in
      sendResponse(response, 401, 'NotLoggedIn');
    }
  }

  /**
   * Activate a character
   * Params:
   *  characterPid <required>: The Pid of the Character to set as active
   */
  private static async activateCharacter(request: Request, response: Response): Promise<void> {

    if (request.session['user']) {

      const pid = request.body.characterPid;

      if (pid) {

        const user: UserInstance = await User.findOne({
          attributes: ['id'],
          where: {
            id: request.session['user'].id
          },
          include: [{
            model: Character,
            attributes: ['id', 'pid', 'userId'],
          }]
        });

        const characters = user.characters.map(function (character: CharacterInstance): Object {
          return character;
        });
        const characterToActivateList = characters.filter(_ => _.pid === pid);

        if (characterToActivateList.length > 0) {

          await Character.update(
            {
              isActive: false
            },
            {
              where: {
                userId: request.session['user'].id
              }
            });

          const characterToActivate = characterToActivateList[0];

          if (user.id === characterToActivate.userId) {

            characterToActivate.isActive = true;
            await characterToActivate.save();
            sendResponse(response, 200, 'CharacterActivated');

          } else {

            // That character does not belong to the user who initiated the request
            sendResponse(response, 401, 'NotYourCharacter');
          }

        } else {

          // That character does not exist
          sendResponse(response, 404, 'NoCharacterFound');
        }

      } else {

        await Character.update(
          {
            isActive: false
          },
          {
            where: {
              userId: request.session['user'].id
            }
          });

        // Missing parameters
        sendResponse(response, 200, 'AllCharactersDeactivated');
      }

    } else {

      // User is not logged in
      sendResponse(response, 401, 'NotLoggedIn');
    }
  }

  /**
   * Get a base64 string containing the client ID and secret key
   */
  private static getSSOAuthString(): string {
    return new Buffer(ssoConfig.get('client_ID') + ':' + ssoConfig.get('secret_key')).toString('base64');
  }
}
