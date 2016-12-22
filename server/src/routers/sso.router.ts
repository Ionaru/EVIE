import { Response, Request } from 'express';
import { logger } from '../controllers/logger.service';
import { BaseRouter } from './base.router';
import { ssoConfig } from '../controllers/config.service';
import https = require('https');
import { Character, CharacterInstance } from '../models/character/character';
import { generateUniquePID, generateRandomString } from '../controllers/pid.service';

const scopes = ['characterWalletRead', 'characterAccountRead'];
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
      response.status(401);
      response.json({error: 'NotLoggedIn'});
    } else {
      if (request.query.characterPid) {
        let character: CharacterInstance = await Character.findOne({
          attributes: ['pid'],
          where: {
            pid: request.query.characterPid,
            userId: request.session['user'],
          },
        });
        request.session['characterPid'] = character.pid;
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
      let finalUrl = oauthHost + oauthPath + args.join('&');

      response.redirect('https://' + finalUrl);
    }
  }

  /**
   * Process the callback from the SSO service, create/update character information before proceeding to Authorization
   * Params:
   *  code <required>: The authorization token that will be used to get a Character's access code later in the process
   *  state <required>: The random
   *
   */
  private static async processCallBack(request: Request, response: Response): Promise<void> {

    if (!request.session['user']) {
      // User is not logged in and can't initiate SSO callback
      // This route should only be called right after the SSO start, so this shouldn't be possible unless the client
      // was linked directly to this page.
      response.status(401);
      response.json({error: 'NotLoggedIn'});
    } else {

      if (request.query.state && request.session['state'] === request.query.state) {
        // We're verifying the state returned by the EVE SSO service with the state saved earlier

        // The state has been verified and served its purpose, delete it
        delete request.session['state'];

        let character: CharacterInstance = await Character.findOrCreate({
          where: {
            pid: request.session['characterPid']
          },
          defaults: {
            pid: await generateUniquePID(8, Character),
            name: 'NAME',
            userId: request.session['user']
          }
        });

        character = character[0];

        request.session['characterPid'] = character.pid;

        character.authToken = request.query.code;
        character.accessToken = null;
        character.tokenExpiry = null;
        character.refreshToken = null;
        await character.save();

        response.redirect('/sso/auth');
      } else {
        logger.error('Returned state was not valid!');
        response.status(400);
        response.json({error: 'InvalidState'});
      }
    }
  }

  /**
   * Authorize the token gotten from the SSO service and get the character information
   */
  private static async authorizeToken(request: Request, response: Response): Promise<void> {

    let character: CharacterInstance = await Character.findOne({
      attributes: ['id', 'pid', 'authToken', 'refreshToken'],
      where: {
        pid: request.session['characterPid']
      }
    });

    if (character && character.authToken) {

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
          character.refreshToken = authResult[0]['refresh_token'];
          character.accessToken = authResult[0]['access_token'];
          character.tokenExpiry = new Date(Date.now() + (authResult[0]['expires_in'] * 1000));
          character.authToken = null;

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

              // TODO: Duplicate characters should not be added, check on character ID, character name or owner hash

              // Set the character fields from the results
              character.name = characterIdResult[0]['CharacterName'];
              character.characterId = characterIdResult[0]['CharacterID'];
              character.scopes = characterIdResult[0]['Scopes'];
              character.ownerHash = characterIdResult[0]['CharacterOwnerHash'];
              await character.save();

              let characterResponse = character.toJSON();

              // Delete sensitive information from the response
              delete characterResponse.id;
              delete characterResponse.authToken;
              delete characterResponse.refreshToken;
              delete request.session['characterPid'];

              response.json(characterResponse);
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
      response.status(400);
      response.json({
        error: 'NothingToAuthorize'
      });
    }
  }

  private static async refreshToken(request: Request, response: Response): Promise<void> {

    let characterPid = request.query.characterPid;
    let accessToken = request.query.accessToken;

    let character: CharacterInstance = await Character.findOne({
      attributes: ['id', 'accessToken', 'refreshToken'],
      where: {
        pid: characterPid,
      }
    });

    if (character) {
      if (character.accessToken === accessToken) {
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
            response.json({
              accessToken: result[0]['refresh_token'],
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
        response.status(401);
        response.json({
          error: 'WrongAccessToken'
        });
      }
    } else {
      response.status(404);
      response.json({
        error: 'CharacterNotFound'
      });
    }
  }

  private static getSSOAuthString(): string {
    return new Buffer(ssoConfig.get('client_ID') + ':' + ssoConfig.get('secret_key')).toString('base64');
  }
}
