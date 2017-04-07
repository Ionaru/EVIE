import { BaseRequestOptions, Http, Response, ResponseOptions, XHRBackend } from '@angular/http';
import { getTestBed, TestBed } from '@angular/core/testing';
import { MockBackend, MockConnection } from '@angular/http/testing';
import { expect } from 'chai';
import { assert, SinonStub, stub } from 'sinon';

import { Character } from '../../models/character/character.model';
import { EndpointService } from '../../models/endpoint/endpoint.service';
import { Globals } from '../../shared/globals';
import { Logger } from 'angular2-logger/core';
import { SkillQueueData, SkillQueueService } from '../skill-queue.service';
import { Helpers } from '../../shared/helpers';

describe('Services', () => {
  describe('SkillQueueService', () => {

    let mockBackend: MockBackend;
    let skillQueueService: SkillQueueService;
    let logger: Logger;
    let loggerStub: SinonStub;
    let http: Http;

    beforeEach(async () => {
      TestBed.configureTestingModule({
        providers: [
          BaseRequestOptions,
          MockBackend,
          SkillQueueService,
          EndpointService,
          Globals,
          Logger,
          Helpers,
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
      http = testbed.get(Http);
      skillQueueService = testbed.get(SkillQueueService);
      logger = testbed.get(Logger);
      loggerStub = stub(logger, 'error');

    });

    afterEach(() => {
      loggerStub.restore();
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
      characterId: 123,
      name: 'Dummy',
      accessToken: 'abc',
      ownerHash: 'aaa',
      pid: '123',
      scopes: 'all',
      tokenExpiry: '',
      isActive: true
    });

    const dummySkillQueueResponse: Array<SkillQueueData> = [{
      'skill_id': 3429,
      'finished_level': 5,
      'queue_position': 10,
      'finish_date': '2017-04-09T07:51:10Z',
      'start_date': '2017-04-04T10:46:20Z',
      'training_start_sp': 45255,
      'level_end_sp': 256000,
      'level_start_sp': 45255
    }, {
      'skill_id': 3341,
      'finished_level': 4,
      'queue_position': 11,
      'finish_date': '2017-04-12T15:58:16Z',
      'start_date': '2017-04-09T07:51:10Z',
      'training_start_sp': 32000,
      'level_end_sp': 181020,
      'level_start_sp': 32000
    }];

    it('should be able to process skill queue data', async () => {
      mockResponse({
        body: JSON.stringify(dummySkillQueueResponse),
        status: 200
      });

      const skillQueueData: Array<SkillQueueData> = await skillQueueService.getSkillQueue(dummyCharacter);
      expect(skillQueueData.length).to.equal(2);
      expect(skillQueueData[0]).to.be.an('object');
      expect(skillQueueData[1]).to.be.an('object');
      expect(skillQueueData).to.deep.equal([{
        'skill_id': 3429,
        'finished_level': 5,
        'queue_position': 10,
        'finish_date': '2017-04-09T07:51:10Z',
        'start_date': '2017-04-04T10:46:20Z',
        'training_start_sp': 45255,
        'level_end_sp': 256000,
        'level_start_sp': 45255
      }, {
        'skill_id': 3341,
        'finished_level': 4,
        'queue_position': 11,
        'finish_date': '2017-04-12T15:58:16Z',
        'start_date': '2017-04-09T07:51:10Z',
        'training_start_sp': 32000,
        'level_end_sp': 181020,
        'level_start_sp': 32000
      }]);
    });

    it('should be able to process a response with empty body', async () => {
      mockResponse({
        body: JSON.stringify({}),
        status: 200
      });

      const skillQueueData: Array<SkillQueueData> = await skillQueueService.getSkillQueue(dummyCharacter);

      assert.calledOnce(loggerStub);
      expect(loggerStub.firstCall.args[0]).to.equal('Data did not contain expected values');
      expect(skillQueueData).to.equal(null);
    });

    it('should be able to process an empty response', async () => {
      mockResponse({});

      const skillQueueData: Array<SkillQueueData> = await skillQueueService.getSkillQueue(dummyCharacter);

      assert.calledOnce(loggerStub);
      expect(loggerStub.firstCall.args[0]).to.equal('Response was not OK');
      expect(skillQueueData).to.equal(null);
    });

    it('should be able to process a HTTP error', async () => {
      mockErrorResponse({
        body: '',
        status: 403
      });

      const skillQueueData: Array<SkillQueueData> = await skillQueueService.getSkillQueue(dummyCharacter);

      assert.calledOnce(loggerStub);
      expect(skillQueueData).to.equal(null);
    });

    it('should be able to process a non-200 status code', async () => {
      mockResponse({
        body: '',
        status: 500
      });

      const skillQueueData: Array<SkillQueueData> = await skillQueueService.getSkillQueue(dummyCharacter);
      assert.calledOnce(loggerStub);
      expect(loggerStub.firstCall.args[0]).to.equal('Response was not OK');
      expect(skillQueueData).to.equal(null);
    });
  });
});
