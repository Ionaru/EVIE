import { BaseRequestOptions, Http, Response, ResponseOptions, XHRBackend } from '@angular/http';
import { getTestBed, TestBed } from '@angular/core/testing';
import { MockBackend, MockConnection } from '@angular/http/testing';
import { expect } from 'chai';

import { Character } from '../../components/character/character';
import { EndpointService } from '../../components/endpoint/endpoint.service';
import { Globals } from '../../globals';
import { ShipService } from './ship.service';
import { Logger } from 'angular2-logger/core';
import { SinonStub, stub } from 'sinon';

describe('Dashboard', () => {
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

      function setupConnections(backend: MockBackend, options: any) {
        backend.connections.subscribe((connection: MockConnection) => {
          const responseOptions = new ResponseOptions(options);
          const response = new Response(responseOptions);
          connection.mockRespond(response);
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

      it('should be able to process ship data', async () => {
        setupConnections(mockBackend, {
          body: JSON.stringify({'ship_type_id': 596, 'ship_item_id': 1002943704843, 'ship_name': 'Dummy\'s Impairor'}),
          status: 200
        });

        shipService.getCurrentShip(dummyCharacter).then((shipData: Object) => {
          expect(shipData).to.be.an('object');
          expect(Object.keys(shipData).length).to.equal(2);
          expect(shipData['id']).to.be.a('number');
          expect(shipData['id']).to.equal(596);
          expect(shipData['name']).to.be.a('string');
          expect(shipData['name']).to.equal('Dummy\'s Impairor');
        });
      });

      it('should be able to process HTTP errors', async () => {
        setupConnections(mockBackend, {
          body: '',
          status: 500
        });

        const shipData: Object = await shipService.getCurrentShip(dummyCharacter);
        expect(shipData).to.be.an('object');
        expect(Object.keys(shipData).length).to.equal(2);
        expect(shipData['id']).to.be.a('number');
        expect(shipData['id']).to.equal(-1);
        expect(shipData['name']).to.be.a('string');
        expect(shipData['name']).to.equal('Error');
      });
    });
  });
});
