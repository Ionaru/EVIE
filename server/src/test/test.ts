import sinon = require('sinon');
import www = require('../bin/www');
import fetch from 'node-fetch';

import { db } from '../controllers/db.service';
import { logger } from '../controllers/logger.service';
import { mainConfig, dbConfig, ssoConfig } from '../controllers/config.service';
import { expect } from 'chai';

describe('Application', function () {

  this.timeout(10000);
  process.env['SILENT'] = true;
  process.env['TEST'] = true;
  process.env['PORT'] = 3001;

  describe('control', function () {
    it('should be able to start', async function () {
      await www.init().catch(console.error.bind(console));
    });
    it('should be able to perform cleanup without error', function (done) {
      www.cleanup(() => {
        done();
      });
    });
  });
  describe('database pool', function () {
    const db_suffix = '_test';
    it('should have a DB pool after start', async function () {
      await www.init().catch(console.error.bind(console));
      expect(db.get()['_closed']).to.be.false;
    });
    it(`should be connected to a test database (ending with "${db_suffix}")`, function (done) {
      db.get().query('SELECT DATABASE()', (err, rows) => {
        const result = rows[0]['DATABASE()'];
        expect(err).to.be.null;
        const re = new RegExp(`${db_suffix}$`);
        if (!re.test(result)) {
          console.error(`Database name "${result}" did not have expected suffix "${db_suffix}"!`);
          console.error(`The database should have suffix "${db_suffix}" for testing safety!`);
          process.exit(1);
        } else {
          expect(re.test(result)).to.be.ok;
          done();
        }
      });
    });
    it('shouldn\'t have a DB pool after cleanup', function (done) {
      www.cleanup(() => {
        expect(db.get()['_allConnections']).to.deep.equal([]);
        expect(db.get()['_closed']).to.be.true;
        done();
      });
    });
  });

  describe('logger', function () {
    before(async function () {
      await www.init().catch(console.error.bind(console));
    });

    after(function (done) {
      www.cleanup(() => {
        done();
      });
    });

    it('should be able to use the logger', async function () {
      logger.info('Test message please ignore');
      logger.warn('Test message please ignore');
      logger.debug('Test message please ignore');
    });
  });

  describe('configuration', function () {
    before(async function () {
      await www.init().catch(console.error.bind(console));
    });

    after(function (done) {
      www.cleanup(() => {
        done();
      });
    });

    it('should be able read from a config file', async function () {
      mainConfig.get('testValueDoesNotExist');
      dbConfig.get('testValueDoesNotExist');
      ssoConfig.get('testValueDoesNotExist');
    });

    it('shouldn\'t be empty', async function () {
      expect(mainConfig.config).to.not.deep.equal({});
      expect(dbConfig.config).to.not.deep.equal({});
      expect(ssoConfig.config).to.not.deep.equal({});
    });
  });
});

describe('API route', function () {

  this.timeout(10000);
  process.env['SILENT'] = true;
  process.env['TEST'] = true;
  process.env['PORT'] = 3001;

  const url = `http://127.0.0.1:${process.env['PORT']}/api`;

  before(async function () {
    await www.init().catch(console.error.bind(console));
  });

  after(function (done) {
    www.cleanup(() => {
      done();
    });
  });

  describe('handshake', function () {

    it('should should return NotLoggedIn on first call', async function () {
      const handshakeResponse = await fetch(url + '/handshake');
      const handshakeResult = await handshakeResponse.json();

      expect(handshakeResult['state']).to.equal('success');
      expect(handshakeResult['message']).to.equal('NotLoggedIn');
    });
  });
});
