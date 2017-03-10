import { BaseRequestOptions, Http, Response, ResponseOptions, XHRBackend } from '@angular/http';
import { getTestBed, TestBed } from '@angular/core/testing';
import { MockBackend, MockConnection } from '@angular/http/testing';
import { expect } from 'chai';
import { assert, SinonFakeTimers, SinonStub, spy, stub, useFakeTimers } from 'sinon';

import { Character } from '../../../components/character/character';
import { EndpointService } from '../../../components/endpoint/endpoint.service';
import { Globals } from '../../../globals';
import { BalanceService } from './balance.service';

describe('Evedata', () => {
  describe('Wallet', () => {
    describe('BalanceService', () => {

      let http: Http;
      let mockBackend: MockBackend;
      let balanceService: BalanceService;
      let globals: Globals;
      let cStub: SinonStub;
      let clock: SinonFakeTimers;

      beforeEach(async () => {
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

        http = testbed.get(Http);
        mockBackend = testbed.get(MockBackend);
        balanceService = testbed.get(BalanceService);

        cStub = stub(console, 'error');
        localStorage.clear();
      });

      afterEach(() => {
        cStub.restore();
        if (clock) {
          clock.restore();
        }
      });

      function setupConnections(backend: MockBackend, options: any) {
        backend.connections.subscribe((connection: MockConnection) => {
          const responseOptions = new ResponseOptions(options);
          const response = new Response(responseOptions);
          connection.mockRespond(response);
        });
      }

      const fakeBalanceXML = `<?xml version='1.0' encoding='UTF-8'?>
        <eveapi version="2">
          <currentTime>2000-01-01 00:00:00</currentTime>
          <result>
            <rowset name="accounts" key="accountID" columns="accountID,accountKey,balance">
            <row accountID="1234567" accountKey="1000" balance="500000.00" />
            </rowset>
          </result>
          <cachedUntil>2000-01-01 00:15:00</cachedUntil>
        </eveapi>`;

      const fakeBalanceError = `<?xml version='1.0' encoding='UTF-8'?>
        <eveapi version="2">
          <currentTime>2000-01-01 00:00:00</currentTime>
          <error code="224">DummyPermissionError</error>
          <cachedUntil>2000-01-01 00:15:00</cachedUntil>
        </eveapi>`;

      const invalidXML = `<?xml version='1.0' encoding='UTF-8'?>
        <eveapi version="2"
          <currentTime>2000-01-01 00:00:00</currentTime>
          <error code="224">DummyPermissionError</error>
          cachedUntil>2000-01-01 00:15:00</cachedUntil>
        </eveapi>`;

      it('should be able to process balance data', async () => {

        setupConnections(mockBackend, {
          body: fakeBalanceXML,
          status: 200
        });

        expect(localStorage.getItem('AccountBalance' + globals.selectedCharacter.characterId)).to.not.exist;
        const balance = await balanceService.getBalance();
        expect(balance).to.be.a('string');
        expect(balance).to.equal('500000.00');

        expect(Number(balance)).to.be.a('number');
        expect(Number(balance)).to.equal(500000.00);
        expect(localStorage.getItem('AccountBalance' + globals.selectedCharacter.characterId)).to.exist;
      });

      it('should get cached balance data from localStorage', async () => {

        setupConnections(mockBackend, {
          body: fakeBalanceXML,
          status: 200
        });

        expect(localStorage.getItem('AccountBalance' + globals.selectedCharacter.characterId)).to.not.exist;
        // First request to set up a cached result in localStorage
        await balanceService.getBalance();

        expect(localStorage.getItem('AccountBalance' + globals.selectedCharacter.characterId)).to.exist;

        clock = useFakeTimers(new Date('2000-01-01 00:10:00').getTime());

        // We watch 'http.get()' from this point on
        const httpSpy = spy(http, 'get');
        const balance = await balanceService.getBalance();
        // 'http.get()' should not have been called, this means the result came from localStorage
        assert.notCalled(httpSpy);

        expect(balance).to.be.a('string');
        expect(balance).to.equal('500000.00');
        expect(Number(balance)).to.be.a('number');
        expect(Number(balance)).to.equal(500000.00);
        expect(localStorage.getItem('AccountBalance' + globals.selectedCharacter.characterId)).to.exist;
      });

      it('should fetch new balance data when cache is expired', async () => {

        setupConnections(mockBackend, {
          body: fakeBalanceXML,
          status: 200
        });

        expect(localStorage.getItem('AccountBalance' + globals.selectedCharacter.characterId)).to.not.exist;
        // First request to set up a cached result in localStorage
        await balanceService.getBalance();

        expect(localStorage.getItem('AccountBalance' + globals.selectedCharacter.characterId)).to.exist;

        clock = useFakeTimers(new Date('2001-01-01 00:10:00').getTime());

        // We watch 'http.get()' from this point on
        const httpSpy = spy(http, 'get');
        const balance = await balanceService.getBalance();
        // 'http.get()' should been called, this means the result came from a new request
        assert.calledOnce(httpSpy);

        expect(balance).to.be.a('string');
        expect(balance).to.equal('500000.00');
        expect(Number(balance)).to.be.a('number');
        expect(Number(balance)).to.equal(500000.00);
        expect(localStorage.getItem('AccountBalance' + globals.selectedCharacter.characterId)).to.exist;
      });

      it('should be able to process an error response', async () => {
        setupConnections(mockBackend, {
          body: fakeBalanceError,
          status: 403
        });

        const balance = await balanceService.getBalance(true);
        expect(balance).to.be.a('string');
        expect(balance).to.equal('Error');
        expect(localStorage.getItem('AccountBalance' + globals.selectedCharacter.characterId)).to.not.exist;
      });

      it('should be able to process an empty response', async () => {
        setupConnections(mockBackend, {});

        const balance = await balanceService.getBalance(true);
        expect(balance).to.be.a('string');
        expect(balance).to.equal('Error');
        expect(localStorage.getItem('AccountBalance' + globals.selectedCharacter.characterId)).to.not.exist;
      });

      it('should be able to process an invalid response', async () => {
        setupConnections(mockBackend, {
          body: `IamAnInvalidResponse`,
          status: 200
        });

        const balance = await balanceService.getBalance(true);
        expect(balance).to.be.a('string');
        expect(balance).to.equal('Error');
        expect(localStorage.getItem('AccountBalance' + globals.selectedCharacter.characterId)).to.not.exist;
      });

      it('should be able to process an invalid HTTP response', async () => {
        setupConnections(mockBackend, {
          what: 7,
          problem: 'nothing'
        });

        const balance = await balanceService.getBalance(true);
        expect(balance).to.be.a('string');
        expect(balance).to.equal('Error');
        expect(localStorage.getItem('AccountBalance' + globals.selectedCharacter.characterId)).to.not.exist;
      });

      it('should be able to process an invalid XML response', async () => {
        setupConnections(mockBackend, {
          body: invalidXML,
          status: 200
        });

        const balance = await balanceService.getBalance(true);
        expect(balance).to.be.a('string');
        expect(balance).to.equal('Error');
        expect(localStorage.getItem('AccountBalance' + globals.selectedCharacter.characterId)).to.not.exist;
      });
    });
  });
});
