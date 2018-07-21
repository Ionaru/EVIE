import { AfterViewInit, Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { BalanceService } from '../../../services/balance.service';
import { IJournalData, JournalService } from '../../../services/journal.service';
import { INames, NamesService } from '../../../services/names.service';
import { RefTypesService } from '../../../services/reftypes.service';
import { ITransactionData, ITransactionData2, TransactionService, TransactionsService } from '../../../services/transactions.service';
import { CountUp, ICountUpOptions } from '../../../shared/count-up';
import { Globals } from '../../../shared/globals';

@Component({
  providers: [BalanceService, JournalService, TransactionService, TransactionsService, RefTypesService],
  styleUrls: ['wallet.component.scss'],
  templateUrl: 'wallet.component.html',
})
export class WalletComponent implements OnInit, AfterViewInit {
  public journalData: IJournalData[] = [];
  public journalDataRequestDone = false;
  public transactionData: ITransactionData[] = [];
  public transactionData2: ITransactionData2[] = [];
  public transactionDataRequestDone = false;
  public balance: CountUp;
  public balanceError = false;
  public names: INames;

  constructor(private balanceService: BalanceService,
              private journalService: JournalService,
              private transactionService: TransactionService,
              private transactionsService: TransactionsService,
              private namesService: NamesService,
              private refTypesService: RefTypesService,
              private globals: Globals,
              private title: Title) { }

  public ngOnInit(): void {
    this.names = this.globals.names;
    this.title.setTitle('EVE Track - Wallet');
    this.showJournal().then();
    this.showTransactions().then();
    this.getTransactions().then();
  }

  public ngAfterViewInit(): void {
    this.showBalance().then();
  }

  public getNumberColor(amount: string): string {
    if (amount.indexOf('-') > -1) {
      return 'negative';
    } else if (amount === '0,00') {
      return '';
    } else {
      return 'positive';
    }
  }

  public buyOrSell(value: boolean): string {
    if (value) {
      return 'negative';
    }
    return 'positive';
  }

  public iskFormat(): string {
    return '1.2-2';
  }

  public quantityFormat(): string {
    return '1.0-0';
  }

  public getItemInfo(typeId: string): void {
    // TODO: implement
  }

  public getPersonInfo(clientId: string): void {
    // TODO: implement
  }

  public async showBalance(): Promise<void> {
    const balance = await this.balanceService.getBalance(this.globals.selectedCharacter);
    this.balanceError = false;
    if (this.balance && balance !== -1) {
      this.balance.update(Number(balance));
    } else if (balance !== -1) {
      this.initBalanceCountUp(Number(balance));
    } else {
      this.balanceError = true;
    }
  }

  public initBalanceCountUp(balance: number): void {
    const options: ICountUpOptions = {
      suffix: ' ISK',
      useEasing: false,
    };
    this.balance = new CountUp('balance-number', 0, balance, 2, 1, options);
    this.balance.start();
  }

  public async showJournal(): Promise<void> {
    const refTypes = await this.refTypesService.getRefTypes();
    this.journalData = await this.journalService.getJournal(refTypes);
    this.journalDataRequestDone = true;
  }

  public async showTransactions(): Promise<void> {
    this.transactionData = await this.transactionService.getTransactions();
    this.transactionDataRequestDone = true;
  }

  public async getTransactions(): Promise<void> {
    this.transactionData2 = await this.transactionsService.getTransactions(this.globals.selectedCharacter);
    this.transactionData2 = this.transactionData2.slice(0, 50);
    const typeIds = this.transactionData2.map((entry) => entry.type_id);
    this.namesService.getNames(...typeIds).then();
  }
}
