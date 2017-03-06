import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { BalanceService } from './balance.service';
import { JournalService } from './journal.service';
import { TransactionService } from './transactions.service';
import { RefTypesService } from './reftypes.service';
import { CountUp, CountUpOptions } from '../../../components/count-up';

@Component({
  templateUrl: 'wallet.component.html',
  styleUrls: ['wallet.component.scss'],
  providers: [BalanceService, JournalService, TransactionService, RefTypesService],
})
export class WalletComponent implements OnInit {
  journalData: Array<Object> = [];
  journalDataRequestDone = false;
  transactionData: Array<Object> = [];
  transactionDataRequestDone = false;
  balance: CountUp;

  constructor(private balanceService: BalanceService,
              private journalService: JournalService,
              private transactionService: TransactionService,
              private refTypesService: RefTypesService,
              private title: Title) { }

  ngOnInit(): void {
    this.title.setTitle('EVE Track - Wallet');
    this.showBalance().then();
    this.showJournal().then();
    this.showTransactions().then();
  }

  getNumberColor(amount: string): string {
    if (amount.indexOf('-') > -1) {
      return 'negative';
    } else if (amount === '0,00') {
      return '';
    } else {
      return 'positive';
    }
  }

  buyOrSell(value: string): string {
    if (value === 'buy') {
      return 'negative';
    }
    return 'positive';
  }

  getItemInfo(typeID: string): void {
    // TODO: implement
  }

  getPersonInfo(clientID: string): void {
    // TODO: implement
  }

  async showBalance(): Promise<void> {
    const balance = await this.balanceService.getBalance();
    const options: CountUpOptions = {
      useEasing: false,
    };
    this.balance = new CountUp('balance-number', 0, Number(balance), 2, 1, options);
    this.balance.start();
  }

  async refreshBalance(): Promise<void> {
    const balance = await this.balanceService.getBalance();
    this.balance.update(Number(balance));
  }

  async showJournal(): Promise<void> {
    const refTypes = await this.refTypesService.getRefTypes();
    const refTypeData = refTypes['eveapi']['result']['rowset']['row'];
    this.journalData = await this.journalService.getJournal(refTypeData);
    this.journalDataRequestDone = true;
  }

  async showTransactions(): Promise<void> {
    this.transactionData = await this.transactionService.getTransactions();
    this.transactionDataRequestDone = true;
  }
}
