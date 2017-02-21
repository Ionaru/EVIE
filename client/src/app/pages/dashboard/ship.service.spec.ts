import { BaseRequestOptions, Http, Response, ResponseOptions, XHRBackend } from '@angular/http';
import { async, getTestBed, TestBed } from '@angular/core/testing';
import { Character } from '../../components/character/character';
import { MockBackend, MockConnection } from '@angular/http/testing';
import { EndpointService } from '../../components/endpoint/endpoint.service';
import { Globals } from '../../globals';
import { ShipService } from './ship.service';

describe('Dashboard', () => {
  describe('Services', () => {
    describe('ShipService', () => {

      let mockBackend: MockBackend;
      let shipService: ShipService;

      beforeEach(async(() => {
        TestBed.configureTestingModule({
          providers: [
            BaseRequestOptions,
            MockBackend,
            ShipService,
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
        shipService = testbed.get(ShipService);

      }));

      function setupConnections(backend: MockBackend, options: any) {
        backend.connections.subscribe((connection: MockConnection) => {
          const responseOptions = new ResponseOptions(options);
          const response = new Response(responseOptions);
          connection.mockRespond(response);
        });
      }

      const dummyData: CharacterApiData = {
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

      it('should be able to process ship data', () => {
        setupConnections(mockBackend, {
          body: JSON.stringify({'ship_type_id': 596, 'ship_item_id': 1002943704843, 'ship_name': 'Dummy\'s Impairor'}),
          status: 200
        });

        shipService.getCurrentShip(dummyCharacter).subscribe((shipData: Object) => {
          expect(typeof shipData).toBe('object');
          expect(Object.keys(shipData).length).toBe(2);
          expect(typeof shipData['id']).toBe('number');
          expect(shipData['id']).toBe(596);
          expect(typeof shipData['name']).toBe('string');
          expect(shipData['name']).toBe('Dummy\'s Impairor');
        });
      });

      it('should be able to process HTTP errors', () => {
        setupConnections(mockBackend, {
          body: '',
          status: 500
        });

        shipService.getCurrentShip(dummyCharacter).subscribe((shipData: Object) => {
          expect(typeof shipData).toBe('object');
          expect(Object.keys(shipData).length).toBe(2);
          expect(typeof shipData['id']).toBe('number');
          expect(shipData['id']).toBe(-1);
          expect(typeof shipData['name']).toBe('string');
          expect(shipData['name']).toBe('Error');
        });
      });
    });
  });
});
