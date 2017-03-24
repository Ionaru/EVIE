import { BaseRequestOptions, Http, Response, ResponseOptions, XHRBackend } from '@angular/http';
import { async, getTestBed, TestBed } from '@angular/core/testing';
import { MockBackend, MockConnection } from '@angular/http/testing';
import { expect } from 'chai';

import { Character } from '../character/character';
import { Globals } from '../../globals';
import { EndpointService } from './endpoint.service';
import { Endpoint } from './endpoint';
import { params } from './endpoints';
import { Logger } from 'angular2-logger/core';
import { SinonStub, stub } from 'sinon';

describe('Endpoint', () => {
  describe('Services', () => {
    describe('EndpointService', () => {

      let mockBackend: MockBackend;
      let endpointService: EndpointService;
      let globals: Globals;
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

      it('should be able to construct a simple XML URL', () => {
        const url = endpointService.constructXMLUrl(dummyEndpoint);
        expect(url).to.be.a('string');
        expect(url).to.contain(endpointService.XMLBaseUrl);
        expect(url).to.contain(endpointDir);
        expect(url).to.contain(endpointName);
        expect(url).to.equal(`${endpointService.XMLBaseUrl}${endpointDir}/${endpointName}.xml.aspx?`);
      });

      it('should be able to construct an XML URL with params', () => {
        const params = ['dummyParam1=Value', 'dummyParam2=Value2'];
        const url = endpointService.constructXMLUrl(dummyEndpoint, ['dummyParam1=Value', 'dummyParam2=Value2']);
        expect(url).to.be.a('string');
        expect(url).to.contain(endpointService.XMLBaseUrl);
        expect(url).to.contain(endpointDir);
        expect(url).to.contain(endpointName);
        for (const param of params) {
          expect(url).to.contain(param);
        }

        let testUrl = `${endpointService.XMLBaseUrl}${endpointDir}/${endpointName}.xml.aspx`;
        testUrl += `?${params.join('&')}`;

        expect(url).to.equal(testUrl);
      });

      it('should be able to construct an XML URL with an accessToken', () => {
        globals.selectedCharacter = dummyCharacter;

        const url = endpointService.constructXMLUrl(dummyEndpoint);
        expect(url).to.be.a('string');
        expect(url).to.contain(endpointService.XMLBaseUrl);
        expect(url).to.contain(endpointDir);
        expect(url).to.contain(endpointName);

        let testUrl = `${endpointService.XMLBaseUrl}${endpointDir}/${endpointName}.xml.aspx`;
        testUrl += `?accessToken=${dummyCharacter.accessToken}&`;

        expect(url).to.equal(testUrl);
      });

      it('should be able to construct a complex XML URL', () => {
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
              'id': 1234,
              'name': 'TestData',
              'category': 'test_category'
            },
            {
              'id': 9876,
              'name': 'MockData',
              'category': 'mock_category'
            }
          ]),
          status: 200
        });

        const nameData: Array<{ id: number, name: string, category: string }> = await endpointService.getNames(0, 1);
        expect(nameData).to.be.an('array');

        expect(nameData[0]).to.be.an('object');
        expect(nameData[0].id).to.equal(1234);
        expect(nameData[0].name).to.equal('TestData');
        expect(nameData[0].category).to.equal('test_category');

        expect(nameData[1]).to.be.a('object');
        expect(nameData[1].id).to.equal(9876);
        expect(nameData[1].name).to.equal('MockData');
        expect(nameData[1].category).to.equal('mock_category');
      });

      it('should be able to process an empty name data response', async () => {
        setupConnections(mockBackend, {
          body: '',
          status: 500
        });

        const nameData: Array<{ id: number, name: string, category: string }> = await endpointService.getNames(0, 1);
        expect(nameData).to.be.an('array');
        expect(nameData.length).to.equal(0);
        expect(nameData).to.deep.equal([]);
      });

      it('should be able to process an invalid HTTP response', async () => {
        setupConnections(mockBackend, {
          what: 7,
          problem: 'nothing'
        });

        const nameData: Array<{ id: number, name: string, category: string }> = await endpointService.getNames(0, 1);
        expect(nameData).to.be.an('array');
        expect(nameData.length).to.equal(0);
        expect(nameData).to.deep.equal([]);
      });

      it('should be able to get specific name from name data', async () => {
        setupConnections(mockBackend, {
          body: JSON.stringify([
            {
              'id': 1234,
              'name': 'TestData',
              'category': 'test_category'
            },
            {
              'id': 9876,
              'name': 'MockData',
              'category': 'mock_category'
            }
          ]),
          status: 200
        });

        const nameData: Array<{ id: number, name: string, category: string }> = await endpointService.getNames(0, 1);
        expect(nameData).to.be.an('array');

        expect(nameData[0]).to.be.an('object');
        expect(nameData[0].id).to.equal(1234);
        expect(nameData[0].name).to.equal('TestData');
        expect(nameData[0].category).to.equal('test_category');

        expect(nameData[1]).to.be.a('object');
        expect(nameData[1].id).to.equal(9876);
        expect(nameData[1].name).to.equal('MockData');
        expect(nameData[1].category).to.equal('mock_category');

        const TestData = endpointService.getNameFromNameData(nameData, 1234);
        expect(TestData).to.be.a('string');
        expect(TestData).to.equal('TestData');

        const MockData = endpointService.getNameFromNameData(nameData, 9876);
        expect(MockData).to.be.a('string');
        expect(MockData).to.equal('MockData');
      });

      it('should return \'Error\' when name does not exist in name data', async () => {
        setupConnections(mockBackend, {
          body: JSON.stringify([
            {
              'id': 1234,
              'name': 'TestData',
              'category': 'test_category'
            },
            {
              'id': 9876,
              'name': 'MockData',
              'category': 'mock_category'
            }
          ]),
          status: 200
        });

        const nameData: Array<{ id: number, name: string, category: string }> = await endpointService.getNames(0, 1);
        expect(nameData).to.be.an('array');

        expect(nameData[0]).to.be.an('object');
        expect(nameData[0].id).to.equal(1234);
        expect(nameData[0].name).to.equal('TestData');
        expect(nameData[0].category).to.equal('test_category');

        expect(nameData[1]).to.be.an('object');
        expect(nameData[1].id).to.equal(9876);
        expect(nameData[1].name).to.equal('MockData');
        expect(nameData[1].category).to.equal('mock_category');

        const WrongData = endpointService.getNameFromNameData(nameData, 5678);
        expect(WrongData).to.be.a('string');
        expect(WrongData).to.equal('Error');
      });
    });
  });
});
