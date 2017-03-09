import { BaseRequestOptions, Http, Response, ResponseOptions, XHRBackend } from '@angular/http';
import { async, getTestBed, TestBed } from '@angular/core/testing';
import { MockBackend, MockConnection } from '@angular/http/testing';
import { expect } from 'chai';
import { stub, SinonStub } from 'sinon';
// import * as sinon from 'sinon';

import { Character } from '../../../components/character/character';
import { EndpointService } from '../../../components/endpoint/endpoint.service';
import { Globals } from '../../../globals';
import { BalanceService } from './balance.service';

describe('Evedata', () => {

  let cStub: SinonStub;

  beforeEach(() => {
    cStub = stub(console, 'error');
  });

  describe('Wallet', () => {
    describe('BalanceService', () => {

      let mockBackend: MockBackend;
      let balanceService: BalanceService;
      let globals: Globals;

      beforeEach(async(() => {
        TestBed.configureTestingModule({
          providers: [
            BaseRequestOptions,
            MockBackend,
            BalanceService,
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
        globals = testbed.get(Globals);
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
        globals.selectedCharacter = new Character(dummyData);

        mockBackend = testbed.get(MockBackend);
        balanceService = testbed.get(BalanceService);
      }));

      function setupConnections(backend: MockBackend, options: any) {
        backend.connections.subscribe((connection: MockConnection) => {
          const responseOptions = new ResponseOptions(options);
          const response = new Response(responseOptions);
          connection.mockRespond(response);
        });
      }

      it('should be able to process balance data', async() => {

        setupConnections(mockBackend, {
          body: `<?xml version='1.0' encoding='UTF-8'?>
          <eveapi version="2">
            <currentTime>2017-03-08 14:48:59</currentTime>
            <result>
              <rowset name="accounts" key="accountID" columns="accountID,accountKey,balance">
              <row accountID="1234567" accountKey="1000" balance="500000.00" />
              </rowset>
            </result>
            <cachedUntil>2017-03-08 14:59:20</cachedUntil>
          </eveapi>`,
          status: 200
        });

        const balance = await balanceService.getBalance(true);
        expect(balance).to.be.a('string');
        expect(balance).to.equal('500000.00');

        expect(Number(balance)).to.be.a('number');
        expect(Number(balance)).to.equal(500000.00);
        expect(localStorage.getItem('AccountBalance' + globals.selectedCharacter.characterId)).to.exist;
      });

      it('should be able to process an error response', async() => {
        setupConnections(mockBackend, {
          body: `<?xml version='1.0' encoding='UTF-8'?>
          <eveapi version="2">
            <currentTime>2017-03-09 10:34:13</currentTime>
            <error code="224">DummyPermissionError</error>
            <cachedUntil>2017-03-10 10:34:13</cachedUntil>
          </eveapi>`,
          status: 403
        });

        const balance = await balanceService.getBalance(true);
        expect(balance).to.be.a('string');
        expect(balance).to.equal('Error');
        expect(localStorage.getItem('AccountBalance' + globals.selectedCharacter.characterId)).to.not.exist;
      });

      it('should be able to process HTTP errors', async() => {
        setupConnections(mockBackend, {});

        const balance = await balanceService.getBalance(true);
        expect(balance).to.be.a('string');
        expect(balance).to.equal('Error');
        expect(localStorage.getItem('AccountBalance' + globals.selectedCharacter.characterId)).to.not.exist;
      });
    });
  });

  afterEach(() => {
    cStub.restore();
  });

});
