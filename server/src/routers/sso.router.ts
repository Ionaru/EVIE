import https = require('https');

import { Response, Request } from 'express';
import { logger } from '../controllers/logger.service';
import { BaseRouter, sendResponse } from './base.router';
import { ssoConfig } from '../controllers/config.service';
import { Character, CharacterInstance } from '../models/character/character';
import { generateUniquePID, generateRandomString } from '../controllers/pid.service';
import { sockets } from '../bin/www';

const scopes = [
  'characterWalletRead',
  'characterAccountRead',
];
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
        let character: CharacterInstance = await Character.findOne({
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

      let args = [
        'response_type=code',
        'redirect_uri=' + ssoConfig.get('redirect_uri'),
        'client_id=' + ssoConfig.get('client_ID'),
        'scope=' + scopes.join(' '),
        'state=' + request.session['state'],
      ];
      let finalUrl = 'https://' + oauthHost + oauthPath + args.join('&');

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
        let character: CharacterInstance = await Character.findOrCreate({
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
        character = character[0];

        // Set the Characters authToken and clear the other fields for re-authorization.
        character.authToken = request.query.code;
        character.accessToken = null;
        character.tokenExpiry = null;
        character.refreshToken = null;
        await character.save();

        // The characterPid may have changed due to the creation of a new Character, save this new pid so we can use it
        // later.
        request.session['characterPid'] = character.pid;

        // Redirect the user to the next step in the SSO process.
        response.redirect('/sso/auth');

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

    let socket = sockets.filter(_ => _.id === request.session['socket'])[0];

    // Fetch the Character matching the characterPid we saved in the session earlier.
    let character: CharacterInstance = await Character.findOne({
      attributes: ['id', 'pid', 'authToken', 'refreshToken'],
      where: {
        pid: request.session['characterPid']
      }
    });

    if (character && character.authToken) {
      // A character is found and the authToken column is filled.

      let postData = `grant_type=authorization_code&code=${character.authToken}`;

      let authRequestOptions = {
        host: oauthHost,
        path: tokenPath,
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + SSORouter.getSSOAuthString(),
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      };

      // TODO: Use a request module instead of this mess below

      let authRequest = https.request(authRequestOptions, (authReponse) => {
        let authResult = [];
        authReponse.on('data', (chunk: Buffer) => {
          authResult.push(JSON.parse(chunk.toString()));
        });
        authReponse.on('end', async() => {

          // Set the Character fields from the results
          character.refreshToken = authResult[0]['refresh_token'];
          character.accessToken = authResult[0]['access_token'];
          character.tokenExpiry = new Date(Date.now() + (authResult[0]['expires_in'] * 1000));

          // The authToken is no longer useful, remove it from the Character
          character.authToken = null;

          // Prepare a new request to fetch required Character data
          let characterIdRequestOptions = {
            host: oauthHost,
            path: verifyPath,
            headers: {
              'Authorization': 'Bearer ' + authResult[0]['access_token'],
              'Content-Type': 'application/x-www-form-urlencoded',
            }
          };

          let characterIdRequest = https.get(characterIdRequestOptions, (characterIdResponse) => {
            let characterIdResult = [];
            characterIdResponse.on('data', (chunk: Buffer) => {
              characterIdResult.push(JSON.parse(chunk.toString()));
            });
            characterIdResponse.on('end', async() => {

              // Set the Character fields from the results
              character.name = characterIdResult[0]['CharacterName'];
              character.characterId = characterIdResult[0]['CharacterID'];
              character.scopes = characterIdResult[0]['Scopes'];
              character.ownerHash = characterIdResult[0]['CharacterOwnerHash'];
              await character.save();

              let characterResponse = character.toJSON();

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
              sendResponse(response, 200, 'AuthFinished');
            });
            characterIdResponse.on('error', (error) => {
              console.log(error);
            });
            characterIdRequest.end();
          });
          authReponse.on('error', (error) => {
            console.log(error);
          });
        });
        authRequest.on('error', (error) => {
          console.log(error);
        });
      });

      authRequest.write(postData);
      authRequest.end();

    } else {
      // Either no Character was found matching the characterPid or the authToken column was NULL, either way we can't
      // authorize anything here.
      socket.emit('SSO_END', {
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

    // Get the characterPid and accessToken from the request
    let characterPid = request.query.pid;
    let accessToken = request.query.accessToken;

    // Fetch the Character who's accessToken we will refresh
    let character: CharacterInstance = await Character.findOne({
      attributes: ['id', 'accessToken', 'refreshToken'],
      where: {
        pid: characterPid,
      }
    });

    if (character) {
      // A character was found in the database

      if (character.accessToken === accessToken) {
        // The Character's accessToken matches the one sent with the request

        let postData = `grant_type=refresh_token&refresh_token=${character.refreshToken}`;

        let requestOptions = {
          host: oauthHost,
          path: tokenPath,
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + SSORouter.getSSOAuthString(),
            'Content-Type': 'application/x-www-form-urlencoded',
          }
        };

        let httpRequest = https.request(requestOptions, (authReponse) => {
          let result = [];
          authReponse.on('data', (chunk: Buffer) => {
            result.push(JSON.parse(chunk.toString()));
          });
          authReponse.on('end', async() => {
            character.refreshToken = result[0]['refresh_token'];
            character.accessToken = result[0]['access_token'];
            character.tokenExpiry = new Date(Date.now() + (result[0]['expires_in'] * 1000));
            await character.save();
            sendResponse(response, 200, 'TokenRefreshed', {
              token: result[0]['access_token']
            });
          });
          authReponse.on('error', (error) => {
            console.log(error);
          });
        });
        httpRequest.on('error', (error) => {
          console.log(error);
        });
        httpRequest.write(postData);
        httpRequest.end();
      } else {
        // The access token sent with the request did not match with the fetched Character
        sendResponse(response, 401, 'WrongAccessToken');
      }
    } else {
      // There was no Character found with the Pid provided in the request
      sendResponse(response, 404, 'CharacterNotFound');
    }
  }

  /**
   * Get a base64 string containing the client ID and secret key
   */
  private static getSSOAuthString(): string {
    return new Buffer(ssoConfig.get('client_ID') + ':' + ssoConfig.get('secret_key')).toString('base64');
  }
}
