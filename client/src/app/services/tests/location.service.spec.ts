import { getTestBed, TestBed } from '@angular/core/testing';
import { BaseRequestOptions, Http, Response, ResponseOptions, XHRBackend } from '@angular/http';
import { MockBackend, MockConnection } from '@angular/http/testing';
import * as expect from 'must/register';
import { assert, SinonStub, stub } from 'sinon';

// import { Logger } from 'angular2-logger/core';
import { Character } from '../../models/character/character.model';
import { EndpointService } from '../../models/endpoint/endpoint.service';
import { Globals } from '../../shared/globals';
import { LocationService } from '../location.service';

// tslint:disable:only-arrow-functions space-before-function-paren

describe('Services', () => {
  describe('LocationService', () => {

    let mockBackend: MockBackend;
    let locationService: LocationService;
    // let logger: Logger;
    let loggerStub: SinonStub;
    let http: Http;

    beforeEach(async () => {
      TestBed.configureTestingModule({
        providers: [
          BaseRequestOptions,
          MockBackend,
          LocationService,
          EndpointService,
          Globals,
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
      mockBackend = testbed.get(MockBackend);
      http = testbed.get(Http);
      locationService = testbed.get(LocationService);
      // logger = testbed.get(Logger);
      // loggerStub = stub(logger, 'error');

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
      uuid: '123',
      scopes: 'all',
      tokenExpiry: '',
    });

    it('must be able to process location data', async () => {
      mockResponse({
        body: JSON.stringify({solar_system_id: 1000100}),
        status: 200,
      });

      const locationID: number = await locationService.getLocation(dummyCharacter);
      expect(locationID).to.be.a.number();
      expect(locationID).to.equal(1000100);
    });

    it('must be able to process a response with empty body', async () => {
      mockResponse({
        body: JSON.stringify({}),
        status: 200,
      });

      const locationID: number = await locationService.getLocation(dummyCharacter);

      assert.calledOnce(loggerStub);
      expect(loggerStub.firstCall.args[0]).to.equal('Data did not contain expected values');
      expect(locationID).to.be.a.number();
      expect(locationID).to.equal(-1);
    });

    it('must be able to process an empty response', async () => {
      mockResponse({});

      const locationID: number = await locationService.getLocation(dummyCharacter);

      assert.calledOnce(loggerStub);
      expect(loggerStub.firstCall.args[0]).to.equal('Response was not OK');
      expect(locationID).to.be.a.number();
      expect(locationID).to.equal(-1);
    });

    it('must be able to process a HTTP error', async () => {
      mockErrorResponse({
        body: '',
        status: 403,
      });

      const locationID: number = await locationService.getLocation(dummyCharacter);

      assert.calledOnce(loggerStub);
      expect(locationID).to.be.a.number();
      expect(locationID).to.equal(-1);
    });

    it('must be able to process a non-200 status code', async () => {
      mockResponse({
        body: '',
        status: 500,
      });

      const locationID: number = await locationService.getLocation(dummyCharacter);
      assert.calledOnce(loggerStub);
      expect(loggerStub.firstCall.args[0]).to.equal('Response was not OK');
      expect(locationID).to.be.a.number();
      expect(locationID).to.equal(-1);
    });
  });
});
