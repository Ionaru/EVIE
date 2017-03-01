import { BaseRequestOptions, Http, Response, ResponseOptions, XHRBackend } from '@angular/http';
import { async, getTestBed, TestBed } from '@angular/core/testing';
import { MockBackend, MockConnection } from '@angular/http/testing';
import { expect } from 'chai';

import { Character } from '../../components/character/character';
import { EndpointService } from '../../components/endpoint/endpoint.service';
import { Globals } from '../../globals';
import { LocationService } from './location.service';

describe('Dashboard', () => {
  describe('Services', () => {
    describe('LocationService', () => {

      let mockBackend: MockBackend;
      let locationService: LocationService;

      beforeEach(async(() => {
        TestBed.configureTestingModule({
          providers: [
            BaseRequestOptions,
            MockBackend,
            LocationService,
            EndpointService,
            Globals,
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
        locationService = testbed.get(LocationService);

      }));

      function setupConnections(backend: MockBackend, options: any) {
        backend.connections.subscribe((connection: MockConnection) => {
          const responseOptions = new ResponseOptions(options);
          const response = new Response(responseOptions);
          connection.mockRespond(response);
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

      it('should be able to process location data', async () => {
        setupConnections(mockBackend, {
          body: JSON.stringify({'solar_system_id': 1000100}),
          status: 200
        });

        const locationID: number = await locationService.getLocation(dummyCharacter);
        expect(locationID).to.be.a('number');
        expect(locationID).to.equal(1000100);
      });

      it('should be able to process HTTP errors', async () => {
        setupConnections(mockBackend, {
          body: '',
          status: 500
        });

        const locationID: number = await locationService.getLocation(dummyCharacter);
        expect(locationID).to.be.a('number');
        expect(locationID).to.equal(-1);
      });
    });
  });
});
