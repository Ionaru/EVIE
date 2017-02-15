import assert = require('assert');
import sinon = require('sinon');
import www = require('../bin/www');
import fetch from 'node-fetch';

import { db } from '../controllers/db.service';
import { logger } from '../controllers/logger.service';
import { mainConfig, dbConfig, ssoConfig } from '../controllers/config.service';

describe('Mocha', function () {
  describe('sanity', function () {
    it('should be able to assert booleans', function () {
      const booleanTrue = true;
      const booleanFalse = false;
      assert.ok(booleanTrue);
      assert.equal(booleanTrue, true);
      assert.equal(booleanFalse, false);
      assert.notEqual(booleanTrue, false);
      assert.notEqual(booleanFalse, true);
    });
    it('should be able to assert numbers', function () {
      const numberSmall = 12;
      const numberLarge = 123;
      assert.equal(numberSmall, 12);
      assert.equal(numberLarge, 123);
      assert.notEqual(numberSmall, 123);
      assert.notEqual(numberLarge, 12);
    });
    it('should be able to assert strings', function () {
      const stringHello = 'Hello';
      const stringMocha = 'Mocha';
      assert.equal(stringHello, 'Hello');
      assert.equal(stringMocha, 'Mocha');
      assert.notEqual(stringHello, 'Mocha');
      assert.notEqual(stringMocha, 'Hello');
    });
    it('should be able to assert arrays', function () {
      const arrayNumbers = [1, 2, 3];
      const arrayStrings = ['a', 'b', 'c'];
      const arrayEmpty = [];
      assert.deepEqual(arrayNumbers, [1, 2, 3]);
      assert.deepEqual(arrayStrings, ['a', 'b', 'c']);
      assert.deepEqual(arrayEmpty, []);
      assert.notDeepEqual(arrayNumbers, [1, 2, 4]);
      assert.notDeepEqual(arrayStrings, ['a', 'b', 'd']);
      assert.notDeepEqual(arrayEmpty, [0]);
    });
    it('should be able to assert objects', function () {
      const objectFilled = {a: 1, b: '2', c: true};
      const objectEmpty = {};
      assert.deepEqual(objectFilled, {a: 1, b: '2', c: true});
      assert.deepEqual(objectEmpty, {});
      assert.notDeepEqual(objectFilled, {a: 1, b: '2', d: true});
      assert.notDeepEqual(objectFilled, {a: 1, b: '3', c: true});
      assert.notDeepEqual(objectEmpty, {a: 1, b: '3', c: true});
    });
  });
});

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
      assert.equal(db.get()['_closed'], false);
    });
    it(`should be connected to a test database (ending with "${db_suffix}")`, function (done) {
      db.get().query('SELECT DATABASE()', (err, rows) => {
        const result = rows[0]['DATABASE()'];
        assert.equal(err, null);
        const re = new RegExp(`${db_suffix}$`);
        if (!re.test(result)) {
          console.error(`Database name "${result}" did not have expected suffix "${db_suffix}"!`);
          console.error(`The database should have suffix "${db_suffix}" for testing safety!`);
          process.exit(1);
        } else {
          assert.ok(re.test(result));
          done();
        }
      });
    });
    it('shouldn\'t have a DB pool after cleanup', function (done) {
      www.cleanup(() => {
        assert.deepEqual(db.get()['_allConnections'], []);
        assert.equal(db.get()['_closed'], true);
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

    it('should\'t be empty', async function () {
      assert.notDeepEqual(mainConfig.config, {});
      assert.notDeepEqual(dbConfig.config, {});
      assert.notDeepEqual(ssoConfig.config, {});
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
      assert.equal(handshakeResult['state'], 'success');
      assert.equal(handshakeResult['message'], 'NotLoggedIn');
    });
  });
});
