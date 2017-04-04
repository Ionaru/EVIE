import { BaseRequestOptions, Http, Response, ResponseOptions, XHRBackend } from '@angular/http';
import { getTestBed, TestBed } from '@angular/core/testing';
import { MockBackend, MockConnection } from '@angular/http/testing';
import { expect } from 'chai';
import { assert, SinonStub, stub } from 'sinon';

import { Character } from '../../models/character/character.model';
import { EndpointService } from '../../models/endpoint/endpoint.service';
import { Globals } from '../../shared/globals';
import { Logger } from 'angular2-logger/core';
import { SkillData, SkillsService } from '../skills.service';
import { Helpers } from '../../shared/helpers';

describe('Services', () => {
  describe('SkillsService', () => {

    let mockBackend: MockBackend;
    let skillsService: SkillsService;
    let logger: Logger;
    let loggerStub: SinonStub;
    let http: Http;

    beforeEach(async () => {
      TestBed.configureTestingModule({
        providers: [
          BaseRequestOptions,
          MockBackend,
          SkillsService,
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
      skillsService = testbed.get(SkillsService);
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

    const dummySkillsResponse = {
      total_sp: 123,
      skills: [{
        current_skill_level: 4,
        skill_id: 28164,
        skillpoints_in_skill: 135765
      }, {
        current_skill_level: 5,
        skill_id: 20494,
        skillpoints_in_skill: 512000
      }],
      skillsObject: {
        20494: {
          current_skill_level: 5,
          skill_id: 20494,
          skillpoints_in_skill: 512000
        },
        28164: {
          current_skill_level: 4,
          skill_id: 28164,
          skillpoints_in_skill: 135765
        }
      }
    };

    it('should be able to process skills data', async () => {
      mockResponse({
        body: JSON.stringify(dummySkillsResponse),
        status: 200
      });

      const skillData: SkillData = await skillsService.getSkills(dummyCharacter);
      expect(skillData).to.be.an('object');
      expect(skillData).to.deep.equal(dummySkillsResponse);
    });

    it('should be able to process a response with empty body', async () => {
      mockResponse({
        body: JSON.stringify({}),
        status: 200
      });

      const skillData: SkillData = await skillsService.getSkills(dummyCharacter);

      assert.calledOnce(loggerStub);
      expect(loggerStub.firstCall.args[0]).to.equal('Data did not contain expected values');
      expect(skillData).to.equal(null);
    });

    it('should be able to process an empty response', async () => {
      mockResponse({});

      const skillData: SkillData = await skillsService.getSkills(dummyCharacter);

      assert.calledOnce(loggerStub);
      expect(loggerStub.firstCall.args[0]).to.equal('Response was not OK');
      expect(skillData).to.equal(null);
    });

    it('should be able to process a HTTP error', async () => {
      mockErrorResponse({
        body: '',
        status: 403
      });

      const skillData: SkillData = await skillsService.getSkills(dummyCharacter);

      assert.calledOnce(loggerStub);
      expect(skillData).to.equal(null);
    });

    it('should be able to process a non-200 status code', async () => {
      mockResponse({
        body: '',
        status: 500
      });

      const skillData: SkillData = await skillsService.getSkills(dummyCharacter);
      assert.calledOnce(loggerStub);
      expect(loggerStub.firstCall.args[0]).to.equal('Response was not OK');
      expect(skillData).to.equal(null);
    });
  });
});
