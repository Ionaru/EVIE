import { BaseRequestOptions, Http, Response, ResponseOptions, XHRBackend } from '@angular/http';
import { async, getTestBed, TestBed } from '@angular/core/testing';
import { MockBackend, MockConnection } from '@angular/http/testing';
import { expect } from 'chai';

import { Character } from '../../components/character/character';
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
        expect(url).to.be.a('string');
        expect(url).to.contain(endpointService.XMLBaseUrl);
        expect(url).to.contain(endpointDir);
        expect(url).to.contain(endpointName);
        expect(url).to.contain('accessToken=' + dummyCharacter.accessToken);
        for (const param of params) {
          expect(url).to.contain(param);
        }

        let testUrl = `${endpointService.XMLBaseUrl}${endpointDir}/${endpointName}.xml.aspx`;
        testUrl += `?accessToken=${dummyCharacter.accessToken}&${params.join('&')}`;

        expect(url).to.equal(testUrl);
      });

      it('should be able to construct an ESI URL', () => {
        const param1 = 'v99';
        const param2 = 'test';
        const param3 = dummyCharacter.characterId;
        const param4 = 'url';
        const url = endpointService.constructESIUrl(param1, param2, param3, param4);
        expect(url).to.be.a('string');
        expect(url).to.contain(endpointService.ESIBaseUrl);
        expect(url).to.contain(param1);
        expect(url).to.contain(param2);
        expect(url).to.contain(param3.toString());
        expect(url).to.contain(param4);
        expect(url).to.equal(`${endpointService.ESIBaseUrl}${param1}/${param2}/${param3.toString()}/${param4}/`);
      });

      it('should be able to process name data', async () => {

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

        const nameData: Array<{ id: number, name: string, category: string }> = await endpointService.getNames(0, 1);
        expect(nameData).to.be.an('array');

        expect(nameData[0]).to.be.an('object');
        expect(nameData[0].id).to.equal(0);
        expect(nameData[0].name).to.equal('TestData');
        expect(nameData[0].category).to.equal('test_category');

        expect(nameData[1]).to.be.a('object');
        expect(nameData[1].id).to.equal(1);
        expect(nameData[1].name).to.equal('MockData');
        expect(nameData[1].category).to.equal('mock_category');
      });

      it('should be able to process HTTP errors', async () => {
        setupConnections(mockBackend, {
          body: '',
          status: 500
        });

        const nameData: Array<{ id: number, name: string, category: string }> = await endpointService.getNames(0, 1);
        expect(nameData).to.be.an('array');
        expect(nameData.length).to.equal(0);
        expect(nameData).to.deep.equal([]);
      });
    });
  });
});
