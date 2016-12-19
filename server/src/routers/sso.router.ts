import { Response, Request } from 'express';
import { logger } from '../controllers/logger.service';
import { BaseRouter } from './base.router';
import { ssoConfig } from '../controllers/config.service';
import https = require('https');

export class SSORouter extends BaseRouter {

  constructor() {
    super();
    this.createGetRoute('/', SSORouter.startSSOProcess);
    this.createGetRoute('/callback', SSORouter.processCallBack);
    this.createGetRoute('/auth', SSORouter.authorizeToken);
    this.createGetRoute('/renew', SSORouter.renewToken);
    logger.info('Route defined: SSO');
  }

  private static startSSOProcess(request: Request, response: Response): void {
    let red = ssoConfig.get('redirect_uri');
    let client = ssoConfig.get('client_ID');
    response.redirect('https://login.eveonline.com/oauth/authorize?' +
      'response_type=code&' +
      'redirect_uri=' + red + '&' +
      'client_id=' + client + '&' +
      'scope=characterAccountRead&' +
      'state=' + ssoConfig.get('state'));
  }

  private static processCallBack(request: Request, response: Response): void {
    if (request.query.state && ssoConfig.get('state') === request.query.state) {
      console.log(request.query.code);
    }
    console.log(request.query.state);
    response.json({});
  }

  private static authorizeToken(request: Request, response: Response): void {
    let client = ssoConfig.get('client_ID');
    let secret = ssoConfig.get('secret_key');

    let postData = {
      'grant_type': 'authorization_code',
      'code': '***'
    };

    let requestOptions = {
      host: 'login.eveonline.com',
      path: '/oauth/token',
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + new Buffer(client + ':' + secret).toString('base64'),
        'Content-Type': 'application/json',
      },
      agent: null
    };

    requestOptions.agent = new https.Agent(requestOptions);
    let httpRequest = https.request(requestOptions, (authReponse) => {
      // let result = '';
      authReponse.on('data', (chunk: Buffer) => {
        response.json(JSON.parse(chunk.toString()));
      });
      authReponse.on('end', () => {
        // response.json(result);
        console.log('END');
      });
      authReponse.on('error', (error) => {
        console.log(error);
      });
    });
    httpRequest.on('error', (error) => {
      console.log(error);
    });
    httpRequest.write(JSON.stringify(postData));
    console.log('REQUEST', httpRequest);
    httpRequest.end();
  }

  private static async renewToken(request: Request, response: Response): Promise<void> {
    response.json({});
  }
}
