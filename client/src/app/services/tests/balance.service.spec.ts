import { getTestBed, TestBed } from '@angular/core/testing';
import { BaseRequestOptions, Http, Response, ResponseOptions, XHRBackend } from '@angular/http';
import { MockBackend, MockConnection } from '@angular/http/testing';
import * as expect from 'must/register';
import { assert, SinonStub, stub } from 'sinon';

// import { Logger } from 'angular2-logger/core';
import { Character, IApiCharacterData } from '../../models/character/character.model';
import { EndpointService } from '../../models/endpoint/endpoint.service';
import { Globals } from '../../shared/globals';
import { Helpers } from '../../shared/helpers';
import { BalanceService } from '../balance.service';

// tslint:disable:only-arrow-functions space-before-function-paren

describe('Services', () => {
  describe('BalanceService', () => {

    let http: Http;
    let mockBackend: MockBackend;
    let balanceService: BalanceService;
    let globals: Globals;
    let helpers: Helpers;
    // let logger: Logger;
    let loggerStub: SinonStub;

    beforeEach(async () => {
      TestBed.configureTestingModule({
        providers: [
          BaseRequestOptions,
          MockBackend,
          BalanceService,
          EndpointService,
          Globals,
          Helpers,
          // Logger,
          {
            deps: [
              MockBackend,
              BaseRequestOptions,
            ],
            provide: Http,
            useFactory: (backend: XHRBackend, defaultOptions: BaseRequestOptions) => {
              return new Http(backend, defaultOptions);
            },
          },
        ],
      });

      const testbed = getTestBed();
      globals = testbed.get(Globals);
      helpers = testbed.get(Helpers);

      const dummyData: IApiCharacterData = {
        accessToken: 'abc',
        characterId: 123,
        isActive: true,
        name: 'Dummy',
        ownerHash: 'aaa',
        pid: '123',
        scopes: 'all',
        tokenExpiry: '',
      };
      globals.selectedCharacter = new Character(dummyData);

      http = testbed.get(Http);
      mockBackend = testbed.get(MockBackend);
      balanceService = testbed.get(BalanceService);
      // logger = testbed.get(Logger);
      // loggerStub = stub(logger, 'error');

      localStorage.clear();
    });

    afterEach(() => {
      // loggerStub.restore();
    });

    function mockResponse(options: { body?: string, status?: number }) {
      mockBackend.connections.subscribe((connection: MockConnection) => {
        const responseOptions = new ResponseOptions(options);
        const response = new Response(responseOptions);
        connection.mockRespond(response);
      });
    }

    function mockErrorResponse(options: { body?: string, status?: number }) {
      mockBackend.connections.subscribe((connection: MockConnection) => {
        const responseOptions = new ResponseOptions(options);
        const response = new Response(responseOptions);
        connection.mockError(response as any as Error);
      });
    }

    const dummyCharacter = new Character({
      accessToken: 'abc',
      characterId: 123,
      isActive: true,
      name: 'Dummy',
      ownerHash: 'aaa',
      pid: '123',
      scopes: 'all',
      tokenExpiry: '',
    });

    it('must be able to process balance data', async () => {
      mockResponse({
        body: '3023156.97',
        status: 200,
      });

      const balance: number = await balanceService.getBalance(dummyCharacter);
      expect(balance).to.be.a.number();
      expect(balance).to.equal(3023156.97);
    });

    it('must be able to process a balance of zero', async () => {
      mockResponse({
        body: '0',
        status: 200,
      });

      const balance: number = await balanceService.getBalance(dummyCharacter);
      expect(balance).to.be.a.number();
      expect(balance).to.equal(0);
    });

    it('must be able to process a response with empty body', async () => {
      mockResponse({
        body: '',
        status: 200,
      });

      const balance: number = await balanceService.getBalance(dummyCharacter);

      assert.calledOnce(loggerStub);
      expect(balance).to.be.a.number();
      expect(balance).to.equal(-1);
    });

    it('must be able to process a response with a wrong data type', async () => {
      mockResponse({
        body: 'Not a Number',
        status: 200,
      });

      const balance: number = await balanceService.getBalance(dummyCharacter);

      assert.calledOnce(loggerStub);
      expect(loggerStub.firstCall.args[0]).to.equal('Data did not contain expected values');
      expect(balance).to.be.a.number();
      expect(balance).to.equal(-1);
    });

    it('must be able to process an empty response', async () => {
      mockResponse({});

      const balance: number = await balanceService.getBalance(dummyCharacter);

      assert.calledOnce(loggerStub);
      expect(loggerStub.firstCall.args[0]).to.equal('Response was not OK');
      expect(balance).to.be.a.number();
      expect(balance).to.equal(-1);
    });

    it('must be able to process a response with an auth error', async () => {
      mockResponse({
        body: '{"error": "Missing or invalid token.", "sso_status": 400}',
        status: 403,
      });

      const balance: number = await balanceService.getBalance(dummyCharacter);

      assert.calledOnce(loggerStub);
      expect(loggerStub.firstCall.args[0]).to.equal('Response was not OK');
      expect(balance).to.be.a.number();
      expect(balance).to.equal(-1);
    });

    it('must be able to process a non-200 status code with empty body', async () => {
      mockResponse({
        body: '',
        status: 500,
      });

      const balance: number = await balanceService.getBalance(dummyCharacter);
      assert.calledOnce(loggerStub);
      expect(loggerStub.firstCall.args[0]).to.equal('Response was not OK');
      expect(balance).to.be.a.number();
      expect(balance).to.equal(-1);
    });
  });
});
