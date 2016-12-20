import { Response, Request } from 'express';
import { logger } from '../controllers/logger.service';
import { BaseRouter } from './base.router';
import { ssoConfig } from '../controllers/config.service';
import https = require('https');
import { Account, AccountInstance } from '../models/account/account';

const scopes = ['characterWalletRead', 'characterAccountRead'];
const oauthHost = 'login.eveonline.com';
const oauthPath = '/oauth/authorize?';
const tokenPath = '/oauth/token?';

export class SSORouter extends BaseRouter {

  constructor() {
    super();
    this.createGetRoute('/', SSORouter.startSSOProcess);
    this.createGetRoute('/callback', SSORouter.processCallBack);
    this.createGetRoute('/auth', SSORouter.authorizeToken);
    this.createGetRoute('/refresh', SSORouter.refreshToken);
    logger.info('Route defined: SSO');
  }

  private static startSSOProcess(request: Request, response: Response): void {
    let args = [
      'response_type=code',
      'redirect_uri=' + ssoConfig.get('redirect_uri'),
      'client_id=' + ssoConfig.get('client_ID'),
      'scope=' + scopes.join(' '),
      'state=' + ssoConfig.get('state')
    ];
    let finalUrl = oauthHost + oauthPath + args.join('&');

    response.redirect('https://' + finalUrl);
  }

  private static async processCallBack(request: Request, response: Response): Promise<void> {
    if (request.query.state && ssoConfig.get('state') === request.query.state) {

      let acc: AccountInstance = await Account.findOrCreate({
        where: {
          pid: 'myAuthTest'
        },
        defaults: {
          pid: 'myAuthTest',
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

  private static async authorizeToken(request: Request, response: Response): Promise<void> {
    let authString = new Buffer(ssoConfig.get('client_ID') + ':' + ssoConfig.get('secret_key')).toString('base64');

    let acc: AccountInstance = await Account.findOne({
      attributes: ['id', 'authToken', 'refreshToken'],
      where: {
        pid: 'myAuthTest'
      }
    });

    if (acc.refreshToken) {
      response.redirect('/sso/refresh');
    } else {

      let postData = `grant_type=authorization_code&code=${acc.authToken}`;

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
          console.log('END');
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

  private static async refreshToken(request: Request, response: Response): Promise<void> {
    let authString = new Buffer(ssoConfig.get('client_ID') + ':' + ssoConfig.get('secret_key')).toString('base64');

    let acc: AccountInstance = await Account.findOne({
      attributes: ['id', 'refreshToken'],
      where: {
        pid: 'myAuthTest'
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
        console.log('END');
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
