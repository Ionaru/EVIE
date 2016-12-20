import { Response, Request } from 'express';
import { logger } from '../controllers/logger.service';
import { BaseRouter } from './base.router';
import { ssoConfig } from '../controllers/config.service';
import https = require('https');
import { Character, CharacterInstance } from '../models/character/character';
import { generateUniquePID } from '../controllers/pid.service';

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
   */
  private static startSSOProcess(request: Request, response: Response): void {

    if (request.session && request.session['user']) {
      request.session['characterPid'] = 'myAuthTest';

      let args = [
        'response_type=code',
        'redirect_uri=' + ssoConfig.get('redirect_uri'),
        'client_id=' + ssoConfig.get('client_ID'),
        'scope=' + scopes.join(' '),
        'state=' + ssoConfig.get('state')
      ];
      let finalUrl = oauthHost + oauthPath + args.join('&');

      response.redirect('https://' + finalUrl);
    } else {
      response.json({error: 'bad!'});
    }
  }

  /**
   * Process the callback from the SSO service, create/update character information before proceeding to Authorization
   */
  private static async processCallBack(request: Request, response: Response): Promise<void> {
    if (request.query.state && ssoConfig.get('state') === request.query.state) {

      let acc: CharacterInstance = await Character.findOrCreate({
        where: {
          pid: request.session['characterPid']
        },
        defaults: {
          pid: request.session['characterPid'],
          name: 'NAME',
          authToken: null,
          userId: 1
        }
      });

      acc[0].authToken = request.query.code;
      acc[0].accessToken = null;
      acc[0].tokenExpiry = null;
      acc[0].refreshToken = null;
      await acc[0].save();

      response.redirect('/sso/auth');
    } else {
      throw new Error('Returned state was not valid!');
    }
  }

  /**
   * Authorize the token gotten from the SSO service and get the character information
   */
  private static async authorizeToken(request: Request, response: Response): Promise<void> {

    let authString = new Buffer(ssoConfig.get('client_ID') + ':' + ssoConfig.get('secret_key')).toString('base64');

    let character: CharacterInstance = await Character.findOne({
      attributes: ['id', 'pid', 'authToken', 'refreshToken'],
      where: {
        pid: request.session['characterPid']
      }
    });

    if (character.refreshToken) {
      response.redirect('/sso/refresh');
    } else {

      let postData = `grant_type=authorization_code&code=${character.authToken}`;

      let authRequestOptions = {
        host: oauthHost,
        path: tokenPath,
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + authString,
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      };

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
    }
  }

  private static async refreshToken(request: Request, response: Response): Promise<void> {
    let authString = new Buffer(ssoConfig.get('client_ID') + ':' + ssoConfig.get('secret_key')).toString('base64');

    // let pid = await generateUniquePID(8, Character);
    // console.log(pid);

    let acc: CharacterInstance = await Character.findOne({
      attributes: ['id', 'refreshToken'],
      where: {
        pid: request.session['characterPid']
      }
    });

    let postData = `grant_type=refresh_token&refresh_token=${acc.refreshToken}`;

    let requestOptions = {
      host: oauthHost,
      path: tokenPath,
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + authString,
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    };

    let httpRequest = https.request(requestOptions, (authReponse) => {
      let result = [];
      authReponse.on('data', (chunk: Buffer) => {
        result.push(JSON.parse(chunk.toString()));
      });
      authReponse.on('end', async() => {
        acc.refreshToken = result[0]['refresh_token'];
        acc.accessToken = result[0]['access_token'];
        acc.tokenExpiry = new Date(Date.now() + (result[0]['expires_in'] * 1000));
        await acc.save();
        response.json(result[0]);
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
  }
}
