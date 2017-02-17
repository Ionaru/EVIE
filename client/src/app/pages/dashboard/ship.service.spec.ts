import { ShipService } from './ship.service';
import { BaseRequestOptions, Http, Response, ResponseOptions, XHRBackend } from '@angular/http';
import { async, getTestBed, TestBed } from '@angular/core/testing';
import { Character } from '../../components/character/character';
import { MockBackend, MockConnection } from '@angular/http/testing';
import { EndpointService } from '../../components/endpoint/endpoint.service';
import { Globals } from '../../globals';

describe('Service: ShipService', () => {

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

  it('should be able to process ship data', () => {
    setupConnections(mockBackend, {
      body: JSON.stringify({'ship_type_id': 596, 'ship_item_id': 1002943704843, 'ship_name': 'Dummy\'s Impairor'}),
      status: 200
    });
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
    const dummy = new Character(dummyData);

    shipService.getCurrentShip(dummy).subscribe((shipData: Object) => {
      expect(Object.keys(shipData).length).toBe(2);
      expect(shipData['id']).toBe(596);
      expect(shipData['name']).toBe('Dummy\'s Impairor');
    });
  });
});
