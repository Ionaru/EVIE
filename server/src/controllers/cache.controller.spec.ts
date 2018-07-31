import { assert } from 'chai';
// import * as fetchMock from 'fetchMock';
import * as fs from 'fs';
import { SinonStub, stub } from 'sinon';
// import { CacheController } from './cache.controller';
import { DataController } from './data.controller';
import { logger, WinstonPnPLogger } from 'winston-pnp-logger';
import { FetchMockStatic, mock, sandbox } from 'fetch-mock';

describe('Cache control', () => {

    // let server: SinonFakeServer;
    let readFileSyncStub: SinonStub;
    let existsSyncStub: SinonStub;
    let writeFileSyncStub: SinonStub;
    let fetchStub: FetchMockStatic;
    let loggerStub: SinonStub;

    before(() => {
        // server = fakeServer.create({
        //     autoRespond: true,
        // });
        readFileSyncStub = stub(fs, 'readFileSync');
        fetchStub = sandbox().mock('*', 200);

        existsSyncStub = stub(fs, 'existsSync');
        writeFileSyncStub = stub(fs, 'writeFileSync');
        new WinstonPnPLogger({
            announceSelf: false,
        });
        loggerStub = stub(logger, 'debug');
    });

    after(() => {
        fetchStub.restore();
        readFileSyncStub.restore();
        existsSyncStub.restore();
        writeFileSyncStub.restore();
    });

    it('FETCH FAIL & NO CACHE', async () => {
        fetchStub.get('*', {start_time: 'moo'});
        // fetchStub.returns({start_time: 'moo'});
        // server.respondWith(JSON.stringify({start_time: 'moo'}));
        const response = await DataController.getEveStatus();
        assert.isDefined(response);
        assert.equal(response!.start_time, 'moo');
    });

    // it('FETCH FAIL & CACHE PRESENT', () => {
    //
    // });
    //
    // it('FETCH OK & NO CACHE', () => {
    //
    // });
    //
    // it('FETCH OK & CACHE NO MATCH', () => {
    //
    // });
    //
    // it('FETCH OK & CACHE MATCH', () => {
    //
    // });

    //
    // it('should sort the array by the object property', () => {
    //     const sortedArray = Common.sortArrayByObjectProperty(unsortedArray, 'value');
    //
    //     assert.deepEqual(sortedArray, [
    //         {value: 0},
    //         {value: 1},
    //         {value: 2},
    //         {value: 3},
    //         {value: 4},
    //     ]);
    // });
    //
    // it('should reverse sort the array by the object property', () => {
    //     const sortedArray = Common.sortArrayByObjectProperty(unsortedArray, 'value', true);
    //
    //     assert.deepEqual(sortedArray, [
    //         {value: 4},
    //         {value: 3},
    //         {value: 2},
    //         {value: 1},
    //         {value: 0},
    //     ]);
    // });
    //
    // it('should sort the array if two properties are equal', () => {
    //     const unsortedArrayWithEqualValue = [
    //         {value: 2},
    //         {value: 3},
    //         {value: 2},
    //         {value: 4},
    //         {value: 1},
    //     ];
    //
    //     const sortedArray = Common.sortArrayByObjectProperty(unsortedArrayWithEqualValue, 'value');
    //
    //     assert.deepEqual(sortedArray, [
    //         {value: 1},
    //         {value: 2},
    //         {value: 2},
    //         {value: 3},
    //         {value: 4},
    //     ]);
    // });
    //
    // it('should reverse sort the array if two properties are equal', () => {
    //     const unsortedArrayWithEqualValue = [
    //         {value: 2},
    //         {value: 3},
    //         {value: 2},
    //         {value: 4},
    //         {value: 1},
    //     ];
    //
    //     const sortedArray = Common.sortArrayByObjectProperty(unsortedArrayWithEqualValue, 'value', true);
    //
    //     assert.deepEqual(sortedArray, [
    //         {value: 4},
    //         {value: 3},
    //         {value: 2},
    //         {value: 2},
    //         {value: 1},
    //     ]);
    // });
});
