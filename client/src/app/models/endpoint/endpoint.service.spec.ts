import { getTestBed, TestBed } from '@angular/core/testing';
import { BaseRequestOptions, Http, Response, ResponseOptions, XHRBackend } from '@angular/http';
import { MockBackend, MockConnection } from '@angular/http/testing';
import { Logger } from 'angular2-logger/core';
import * as expect from 'must/register';
import { assert, SinonStub, spy, stub } from 'sinon';

import { Globals } from '../../shared/globals';
import { Character, IApiCharacterData } from '../character/character.model';
import { Endpoint } from './endpoint.model';
import { EndpointService } from './endpoint.service';
import { params } from './endpoints';

describe('Models', () => {
  describe('Endpoint', () => {
    describe('Service', () => {

      let mockBackend: MockBackend;
      let endpointService: EndpointService;
      let globals: Globals;
      let http: Http;
      let logger: Logger;
      let loggerStub: SinonStub;

      beforeEach(async () => {
        TestBed.configureTestingModule({
          providers: [
            BaseRequestOptions,
            MockBackend,
            EndpointService,
            Globals,
            Logger,
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
        endpointService = testbed.get(EndpointService);
        globals = testbed.get(Globals);
        http = testbed.get(Http);
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
      const dummyCharacter = new Character(dummyData);

      const endpointDir = 'test';
      const endpointName = 'TheEndpointOfAllEndpoints';

      const dummyEndpoint = new Endpoint(endpointDir, endpointName, [
        params.filter((_) => _.name === 'characterID')[0],
      ]);

      it('must be able to construct a simple XML URL', () => {
        const url = endpointService.constructXMLUrl(dummyEndpoint);
        expect(url).to.be.a.string();
        expect(url).to.include(endpointService.xmlBaseUrl);
        expect(url).to.include(endpointDir);
        expect(url).to.include(endpointName);
        expect(url).to.equal(`${endpointService.xmlBaseUrl}${endpointDir}/${endpointName}.xml.aspx?`);
      });

      it('must be able to construct an XML URL with params', () => {
        const parameters = ['dummyParam1=Value', 'dummyParam2=Value2'];
        const url = endpointService.constructXMLUrl(dummyEndpoint, ['dummyParam1=Value', 'dummyParam2=Value2']);
        expect(url).to.be.a.string();
        expect(url).to.contain(endpointService.xmlBaseUrl);
        expect(url).to.contain(endpointDir);
        expect(url).to.contain(endpointName);
        for (const param of parameters) {
          expect(url).to.contain(param);
        }

        let testUrl = `${endpointService.xmlBaseUrl}${endpointDir}/${endpointName}.xml.aspx`;
        testUrl += `?${parameters.join('&')}`;

        expect(url).to.equal(testUrl);
      });

      it('must be able to construct an XML URL with an accessToken', () => {
        globals.selectedCharacter = dummyCharacter;

        const url = endpointService.constructXMLUrl(dummyEndpoint);
        expect(url).to.be.a.string();
        expect(url).to.contain(endpointService.xmlBaseUrl);
        expect(url).to.contain(endpointDir);
        expect(url).to.contain(endpointName);

        let testUrl = `${endpointService.xmlBaseUrl}${endpointDir}/${endpointName}.xml.aspx`;
        testUrl += `?accessToken=${dummyCharacter.accessToken}&`;

        expect(url).to.equal(testUrl);
      });

      it('must be able to construct a complex XML URL', () => {
        globals.selectedCharacter = dummyCharacter;

        const parameters = ['dummyParam1=Value', 'dummyParam2=Value2'];
        const url = endpointService.constructXMLUrl(dummyEndpoint, ['dummyParam1=Value', 'dummyParam2=Value2']);
        expect(url).to.be.a.string();
        expect(url).to.contain(endpointService.xmlBaseUrl);
        expect(url).to.contain(endpointDir);
        expect(url).to.contain(endpointName);
        expect(url).to.contain('accessToken=' + dummyCharacter.accessToken);
        for (const param of parameters) {
          expect(url).to.contain(param);
        }

        let testUrl = `${endpointService.xmlBaseUrl}${endpointDir}/${endpointName}.xml.aspx`;
        testUrl += `?accessToken=${dummyCharacter.accessToken}&${parameters.join('&')}`;

        expect(url).to.equal(testUrl);
      });

      it('must be able to construct an ESI URL', () => {
        const param1 = 'v99';
        const param2 = 'test';
        const param3 = dummyCharacter.characterId;
        const param4 = 'url';
        const url = endpointService.constructESIUrl(param1, param2, param3, param4);
        expect(url).to.be.a.string();
        expect(url).to.contain(endpointService.esiBaseUrl);
        expect(url).to.contain(param1);
        expect(url).to.contain(param2);
        expect(url).to.contain(param3.toString());
        expect(url).to.contain(param4);
        expect(url).to.equal(`${endpointService.esiBaseUrl}${param1}/${param2}/${param3.toString()}/${param4}/`);
      });

      it('must be able to process name data', async () => {

        setupConnections(mockBackend, {
          body: JSON.stringify([
            {
              category: 'test_category',
              id: 1234,
              name: 'TestData',
            },
            {
              category: 'mock_category',
              id: 9876,
              name: 'MockData',
            },
          ]),
          status: 200,
        });

        const nameData: Array<{ id: number, name: string, category: string }> = await endpointService.getNames(0, 1);
        expect(nameData).to.be.an.array();

        expect(nameData[0]).to.be.an.object();
        expect(nameData[0].id).to.equal(1234);
        expect(nameData[0].name).to.equal('TestData');
        expect(nameData[0].category).to.equal('test_category');

        expect(nameData[1]).to.be.an.object();
        expect(nameData[1].id).to.equal(9876);
        expect(nameData[1].name).to.equal('MockData');
        expect(nameData[1].category).to.equal('mock_category');
      });

      it('must be able to process an empty name data response', async () => {
        setupConnections(mockBackend, {
          body: '',
          status: 500,
        });

        const nameData: Array<{ id: number, name: string, category: string }> = await endpointService.getNames(0, 1);
        expect(nameData).to.be.an.array();
        expect(nameData.length).to.equal(0);
        expect(nameData).to.eql([]);
      });

      it('must be able to process an invalid HTTP response', async () => {
        setupConnections(mockBackend, {
          problem: 'nothing',
          what: 7,
        });

        const nameData: Array<{ id: number, name: string, category: string }> = await endpointService.getNames(0, 1);
        expect(nameData).to.be.an.array();
        expect(nameData.length).to.equal(0);
        expect(nameData).to.eql([]);
      });

      it('must not call the endpoint when no valid names were given', async () => {
        setupConnections(mockBackend, {
          problem: 'nothing',
          what: 7,
        });

        const httpSpy = spy(http, 'get');
        const nameData: Array<{ id: number, name: string, category: string }> = await endpointService.getNames(-1, -1);
        assert.notCalled(httpSpy);

        expect(nameData).to.be.an.array();
        expect(nameData.length).to.equal(0);
        expect(nameData).to.eql([]);
      });

      it('must be able to get specific name from name data', async () => {
        setupConnections(mockBackend, {
          body: JSON.stringify([
            {
              category: 'test_category',
              id: 1234,
              name: 'TestData',
            },
            {
              category: 'mock_category',
              id: 9876,
              name: 'MockData',
            },
          ]),
          status: 200,
        });

        const nameData: Array<{ id: number, name: string, category: string }> = await endpointService.getNames(0, 1);
        expect(nameData).to.be.an.array();

        expect(nameData[0]).to.be.an.object();
        expect(nameData[0].id).to.equal(1234);
        expect(nameData[0].name).to.equal('TestData');
        expect(nameData[0].category).to.equal('test_category');

        expect(nameData[1]).to.be.an.object();
        expect(nameData[1].id).to.equal(9876);
        expect(nameData[1].name).to.equal('MockData');
        expect(nameData[1].category).to.equal('mock_category');

        const testData = endpointService.getNameFromNameData(nameData, 1234);
        expect(testData).to.be.a.string();
        expect(testData).to.equal('TestData');

        const mockData = endpointService.getNameFromNameData(nameData, 9876);
        expect(mockData).to.be.a.string();
        expect(mockData).to.equal('MockData');
      });

      it('must return \'Error\' when name does not exist in name data', async () => {
        setupConnections(mockBackend, {
          body: JSON.stringify([
            {
              category: 'test_category',
              id: 1234,
              name: 'TestData',
            },
            {
              category: 'mock_category',
              id: 9876,
              name: 'MockData',
            },
          ]),
          status: 200,
        });

        const nameData: Array<{ id: number, name: string, category: string }> = await endpointService.getNames(0, 1);
        expect(nameData).to.be.an.array();

        expect(nameData[0]).to.be.an.object();
        expect(nameData[0].id).to.equal(1234);
        expect(nameData[0].name).to.equal('TestData');
        expect(nameData[0].category).to.equal('test_category');

        expect(nameData[1]).to.be.an.object();
        expect(nameData[1].id).to.equal(9876);
        expect(nameData[1].name).to.equal('MockData');
        expect(nameData[1].category).to.equal('mock_category');

        const wrongData = endpointService.getNameFromNameData(nameData, 5678);
        expect(wrongData).to.be.a.string();
        expect(wrongData).to.equal('Error');
      });
    });
  });
});
