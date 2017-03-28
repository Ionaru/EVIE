import { BaseRequestOptions, Http, Response, ResponseOptions, XHRBackend } from '@angular/http';
import { getTestBed, TestBed } from '@angular/core/testing';
import { MockBackend, MockConnection } from '@angular/http/testing';
import { expect } from 'chai';
import { assert, SinonStub, stub } from 'sinon';

import { ApiCharacterData, Character } from '../../models/character/character.model';
import { EndpointService } from '../../models/endpoint/endpoint.service';
import { Globals } from '../../shared/globals';
import { BalanceService } from '../balance.service';
import { Helpers } from '../../shared/helpers';
import { Logger } from 'angular2-logger/core';

describe('Services', () => {
  describe('BalanceService', () => {

    let http: Http;
    let mockBackend: MockBackend;
    let balanceService: BalanceService;
    let globals: Globals;
    let helpers: Helpers;
    let logger: Logger;
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
          Logger,
          {
            deps: [
              MockBackend,
              BaseRequestOptions
            ],
            provide: Http,
            useFactory: (backend: XHRBackend, defaultOptions: BaseRequestOptions) => {
              return new Http(backend, defaultOptions);
            }
          }
        ]
      });

      const testbed = getTestBed();
      globals = testbed.get(Globals);
      helpers = testbed.get(Helpers);

      const dummyData: ApiCharacterData = {
        characterId: 123,
        name: 'Dummy',
        accessToken: 'abc',
        ownerHash: 'aaa',
        pid: '123',
        scopes: 'all',
        tokenExpiry: '',
        isActive: true
      };
      globals.selectedCharacter = new Character(dummyData);

      http = testbed.get(Http);
      mockBackend = testbed.get(MockBackend);
      balanceService = testbed.get(BalanceService);
      logger = testbed.get(Logger);
      loggerStub = stub(logger, 'error');

      localStorage.clear();
    });

    afterEach(() => {
      loggerStub.restore();
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
      characterId: 123,
      name: 'Dummy',
      accessToken: 'abc',
      ownerHash: 'aaa',
      pid: '123',
      scopes: 'all',
      tokenExpiry: '',
      isActive: true
    });

    it('should be able to process balance data', async () => {
      mockResponse({
        body: '[{"wallet_id": 1000, "balance": 302315697}, {"wallet_id": 1200, "balance": 0}]',
        status: 200
      });

      const locationID: number = await balanceService.getBalance(dummyCharacter);
      expect(locationID).to.be.a('number');
      expect(locationID).to.equal(3023156.97);
    });

    it('should be able to process data without a master wallet', async () => {
      mockResponse({
        body: '[{"wallet_id": 1100, "balance": 5000}, {"wallet_id": 1200, "balance": 0}]',
        status: 200
      });

      const locationID: number = await balanceService.getBalance(dummyCharacter);
      expect(loggerStub.firstCall.args[0]).to.equal('Data did not contain master wallet');
      expect(locationID).to.be.a('number');
      expect(locationID).to.equal(-1);
    });

    it('should be able to process a response with empty body', async () => {
      mockResponse({
        body: JSON.stringify({}),
        status: 200
      });

      const locationID: number = await balanceService.getBalance(dummyCharacter);

      assert.calledOnce(loggerStub);
      expect(loggerStub.firstCall.args[0]).to.equal('Data did not contain expected values');
      expect(locationID).to.be.a('number');
      expect(locationID).to.equal(-1);
    });

    it('should be able to process an empty response', async () => {
      mockResponse({});

      const locationID: number = await balanceService.getBalance(dummyCharacter);

      assert.calledOnce(loggerStub);
      expect(loggerStub.firstCall.args[0]).to.equal('Response was not OK');
      expect(locationID).to.be.a('number');
      expect(locationID).to.equal(-1);
    });

    it('should be able to process a HTTP error', async () => {
      mockErrorResponse({
        body: '',
        status: 403
      });

      const locationID: number = await balanceService.getBalance(dummyCharacter);

      assert.calledOnce(loggerStub);
      expect(locationID).to.be.a('number');
      expect(locationID).to.equal(-1);
    });

    it('should be able to process a non-200 status code', async () => {
      mockResponse({
        body: '',
        status: 500
      });

      const locationID: number = await balanceService.getBalance(dummyCharacter);
      assert.calledOnce(loggerStub);
      expect(loggerStub.firstCall.args[0]).to.equal('Response was not OK');
      expect(locationID).to.be.a('number');
      expect(locationID).to.equal(-1);
    });
  });
});
