import expect = require('must/register');
import fetch from 'node-fetch';

import www = require('../bin/www');
import { dbConfig, mainConfig, ssoConfig } from '../services/config.service';
import { db } from '../services/db.service';
import { logger } from '../services/logger.service';

// tslint:disable:only-arrow-functions space-before-function-paren no-console

describe('Application', function () {

  this.timeout(10000);
  process.env.SILENT = Boolean(true).toString();
  process.env.TEST = Boolean(true).toString();
  process.env.PORT = Number(3001).toString();

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
    const dbSuffix = '_test';
    it('should have a DB pool after start', async function () {
      await www.init().catch(console.error.bind(console));
      expect(db.getPool()._closed).to.be.false();
    });
    it(`should be connected to a test database (ending with "${dbSuffix}")`, function (done) {
      db.getPool().query('SELECT DATABASE()', (err, rows) => {
        const result = rows[0]['DATABASE()'];
        expect(err).to.be.null();
        const re = new RegExp(`${dbSuffix}$`);
        if (!re.test(result)) {
          console.error(`Database name "${result}" did not have expected suffix "${dbSuffix}"!`);
          console.error(`The database should have suffix "${dbSuffix}" for testing safety!`);
          process.exit(1);
        } else {
          expect(re.test(result)).to.be.truthy();
          done();
        }
      });
    });
    it('shouldn\'t have a DB pool after cleanup', function (done) {
      www.cleanup(() => {
        expect(db.getPool()._allConnections).to.eql([]);
        expect(db.getPool()._closed).to.be.true();
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
      mainConfig.getProperty('testValueDoesNotExist');
      dbConfig.getProperty('testValueDoesNotExist');
      ssoConfig.getProperty('testValueDoesNotExist');
    });

    it('shouldn\'t be empty', async function () {
      expect(mainConfig.config).to.not.eql({});
      expect(dbConfig.config).to.not.eql({});
      expect(ssoConfig.config).to.not.eql({});
    });
  });
});

describe('API route', function () {

  this.timeout(10000);
  process.env.SILENT = Boolean(true).toString();
  process.env.TEST = Boolean(true).toString();
  process.env.PORT = Number(3001).toString();

  const url = `http://127.0.0.1:${process.env.PORT}/api`;

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

      expect(handshakeResult.state).to.equal('success');
      expect(handshakeResult.message).to.equal('NotLoggedIn');
    });
  });
});
