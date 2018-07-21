import { Endpoint } from './endpoint.model';
import { Param } from './endpoint.param';

export let params: Param[] = [
  new Param('keyID'),
  new Param('vCode'),
  new Param('characterID'),
  new Param('rowCount'),
];

export let endpointList: Endpoint[] = [
  new Endpoint('char', 'CharacterSheet', [
    params.filter((_) => _.name === 'characterID')[0],
  ]),
  new Endpoint('char', 'AccountBalance', [
    params.filter((_) => _.name === 'characterID')[0],
  ]),
  new Endpoint('char', 'WalletJournal', [
    params.filter((_) => _.name === 'characterID')[0],
    params.filter((_) => _.name === 'rowCount')[0],
  ]),
  new Endpoint('char', 'WalletTransactions', [
    params.filter((_) => _.name === 'characterID')[0],
    params.filter((_) => _.name === 'rowCount')[0],
  ]),
  new Endpoint('eve', 'RefTypes', []),
  new Endpoint('server', 'ServerStatus', []),
  new Endpoint('account', 'AccountStatus', []),
  new Endpoint('account', 'APIKeyInfo', []),
  new Endpoint('account', 'Characters', []),
  new Endpoint('api', 'CallList', []),
];
