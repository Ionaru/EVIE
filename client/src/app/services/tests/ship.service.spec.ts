import { BaseRequestOptions, Http, Response, ResponseOptions, XHRBackend } from '@angular/http';
import { getTestBed, TestBed } from '@angular/core/testing';
import { MockBackend, MockConnection } from '@angular/http/testing';
import * as expect from 'must/register';
import { assert, SinonStub, stub } from 'sinon';

import { Character } from '../../models/character/character.model';
import { EndpointService } from '../../models/endpoint/endpoint.service';
import { Globals } from '../../shared/globals';
import { ShipService } from '../ship.service';
import { Logger } from 'angular2-logger/core';

describe('Services', () => {
  describe('ShipService', () => {

    let mockBackend: MockBackend;
    let shipService: ShipService;
    let logger: Logger;
    let loggerStub: SinonStub;

    beforeEach(async () => {
      TestBed.configureTestingModule({
        providers: [
          BaseRequestOptions,
          MockBackend,
          ShipService,
          EndpointService,
          Globals,
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
      mockBackend = testbed.get(MockBackend);
      shipService = testbed.get(ShipService);
      logger = testbed.get(Logger);
      loggerStub = stub(logger, 'error');

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

    const dummyData = {
      characterId: 123,
      name: 'Dummy',
      accessToken: 'abc',
      ownerHash: 'aaa',
      pid: '123',
      scopes: 'all',
      tokenExpiry: '',
      isActive: true
    };
    const dummyCharacter = new Character(dummyData);

    it('must be able to process ship data', async () => {
      mockResponse({
        body: JSON.stringify({'ship_type_id': 596, 'ship_item_id': 1002943704843, 'ship_name': 'Dummy\'s Impairor'}),
        status: 200
      });

      const shipData: {id: number, name: string} = await shipService.getCurrentShip(dummyCharacter);
      expect(shipData).to.be.an.object();
      expect(Object.keys(shipData).length).to.equal(2);
      expect(shipData.id).to.be.a.number();
      expect(shipData.id).to.equal(596);
      expect(shipData.name).to.be.a.string();
      expect(shipData.name).to.equal('Dummy\'s Impairor');
    });

    it('must be able to process a response with empty body', async () => {
      mockResponse({
        body: JSON.stringify({}),
        status: 200
      });

      const shipData: {id: number, name: string} = await shipService.getCurrentShip(dummyCharacter);

      assert.calledOnce(loggerStub);
      expect(loggerStub.firstCall.args[0]).to.equal('Data did not contain expected values');
      expect(shipData).to.be.an.object();
      expect(Object.keys(shipData).length).to.equal(2);
      expect(shipData.id).to.be.a.number();
      expect(shipData.id).to.equal(-1);
      expect(shipData.name).to.be.a.string();
      expect(shipData.name).to.equal('Error');
    });

    it('must be able to process an empty response', async () => {
      mockResponse({});

      const shipData: {id: number, name: string} = await shipService.getCurrentShip(dummyCharacter);

      assert.calledOnce(loggerStub);
      expect(loggerStub.firstCall.args[0]).to.equal('Response was not OK');
      expect(shipData).to.be.an.object();
      expect(Object.keys(shipData).length).to.equal(2);
      expect(shipData.id).to.be.a.number();
      expect(shipData.id).to.equal(-1);
      expect(shipData.name).to.be.a.string();
      expect(shipData.name).to.equal('Error');
    });

    it('must be able to process a HTTP error', async () => {
      mockErrorResponse({
        body: '',
        status: 403
      });

      const shipData: {id: number, name: string} = await shipService.getCurrentShip(dummyCharacter);

      assert.calledOnce(loggerStub);
      expect(shipData).to.be.an.object();
      expect(Object.keys(shipData).length).to.equal(2);
      expect(shipData.id).to.be.a.number();
      expect(shipData.id).to.equal(-1);
      expect(shipData.name).to.be.a.string();
      expect(shipData.name).to.equal('Error');
    });

    it('must be able to process a non-200 status code', async () => {
      mockResponse({
        body: '',
        status: 500
      });

      const shipData: {id: number, name: string} = await shipService.getCurrentShip(dummyCharacter);
      assert.calledOnce(loggerStub);
      expect(loggerStub.firstCall.args[0]).to.equal('Response was not OK');
      expect(shipData).to.be.an.object();
      expect(Object.keys(shipData).length).to.equal(2);
      expect(shipData.id).to.be.a.number();
      expect(shipData.id).to.equal(-1);
      expect(shipData.name).to.be.a.string();
      expect(shipData.name).to.equal('Error');
    });
  });
});
