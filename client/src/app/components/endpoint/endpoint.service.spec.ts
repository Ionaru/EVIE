import { BaseRequestOptions, Http, Response, ResponseOptions, XHRBackend } from '@angular/http';
import { async, getTestBed, TestBed } from '@angular/core/testing';
import { Character } from '../../components/character/character';
import { MockBackend, MockConnection } from '@angular/http/testing';
import { Globals } from '../../globals';
import { EndpointService } from './endpoint.service';
import { Endpoint } from './endpoint';
import { params } from './endpoints';

describe('Endpoint', () => {
  describe('Services', () => {
    describe('EndpointService', () => {

      let mockBackend: MockBackend;
      let endpointService: EndpointService;
      let globals: Globals;

      beforeEach(async(() => {
        TestBed.configureTestingModule({
          providers: [
            BaseRequestOptions,
            MockBackend,
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
        endpointService = testbed.get(EndpointService);
        globals = testbed.get(Globals);

      }));

      function setupConnections(backend: MockBackend, options: any) {
        backend.connections.subscribe((connection: MockConnection) => {
          const responseOptions = new ResponseOptions(options);
          const response = new Response(responseOptions);
          connection.mockRespond(response);
        });
      }

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
      const dummyCharacter = new Character(dummyData);

      const endpointDir = 'test';
      const endpointName = 'TheEndpointOfAllEndpoints';

      const dummyEndpoint = new Endpoint(endpointDir, endpointName, [
        params.filter(_ => _.name === 'characterID')[0],
      ]);

      it('should be able to construct an XML URL', () => {
        globals.selectedCharacter = dummyCharacter;

        const params = ['dummyParam1=Value', 'dummyParam2=Value2'];
        const url = endpointService.constructXMLUrl(dummyEndpoint, ['dummyParam1=Value', 'dummyParam2=Value2']);
        expect(typeof url).toBe('string');
        expect(url).toContain(endpointService.XMLBaseUrl);
        expect(url).toContain(endpointDir);
        expect(url).toContain(endpointName);
        expect(url).toContain('accessToken=' + dummyCharacter.accessToken);
        for (const param of params) {
          expect(url).toContain(param);
        }

        let testUrl = `${endpointService.XMLBaseUrl}${endpointDir}/${endpointName}.xml.aspx`;
        testUrl += `?accessToken=${dummyCharacter.accessToken}&${params.join('&')}`;

        expect(url).toBe(testUrl);
      });

      it('should be able to construct an ESI URL', () => {
        const param1 = 'v99';
        const param2 = 'test';
        const param3 = dummyCharacter.characterId;
        const param4 = 'url';
        const url = endpointService.constructESIUrl(param1, param2, param3, param4);
        expect(typeof url).toBe('string');
        expect(url).toContain(endpointService.ESIBaseUrl);
        expect(url).toContain(param1);
        expect(url).toContain(param2);
        expect(url).toContain(param3.toString());
        expect(url).toContain(param4);
        expect(url).toBe(`${endpointService.ESIBaseUrl}${param1}/${param2}/${param3.toString()}/${param4}/`);
      });

      it('should be able to process name data', () => {

        setupConnections(mockBackend, {
          body: JSON.stringify([
            {
              'id': 0,
              'name': 'TestData',
              'category': 'test_category'
            },
            {
              'id': 1,
              'name': 'MockData',
              'category': 'mock_category'
            }
          ]),
          status: 200
        });

        endpointService.getNames(0, 1).subscribe((nameData: Array<{ id: number, name: string, category: string }>) => {
          expect(typeof nameData).toBe('object');

          expect(typeof nameData[0]).toBe('object');
          expect(nameData[0].id).toBe(0);
          expect(nameData[0].name).toBe('TestData');
          expect(nameData[0].category).toBe('test_category');

          expect(typeof nameData[1]).toBe('object');
          expect(nameData[1].id).toBe(1);
          expect(nameData[1].name).toBe('MockData');
          expect(nameData[1].category).toBe('mock_category');
        });
      });

      it('should be able to process HTTP errors', () => {
        setupConnections(mockBackend, {
          body: '',
          status: 500
        });

        endpointService.getNames(0, 1).subscribe((nameData: Array<{ id: number, name: string, category: string }>) => {
          expect(typeof nameData).toBe('object');
          expect(nameData).toEqual([]);
        });
      });
    });
  });
});
