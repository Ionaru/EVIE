import { AfterViewInit, Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { BalanceService } from '../../../services/balance.service';
import { JournalData, JournalService } from '../../../services/journal.service';
import { TransactionData, TransactionService } from '../../../services/transactions.service';
import { RefTypesService } from '../../../services/reftypes.service';
import { CountUp, CountUpOptions } from '../../../shared/count-up';
import { Globals } from '../../../shared/globals';

@Component({
  templateUrl: 'wallet.component.html',
  styleUrls: ['wallet.component.scss'],
  providers: [BalanceService, JournalService, TransactionService, RefTypesService],
})
export class WalletComponent implements OnInit, AfterViewInit {
  journalData: Array<JournalData> = [];
  journalDataRequestDone = false;
  transactionData: Array<TransactionData> = [];
  transactionDataRequestDone = false;
  balance: CountUp;
  balanceError = false;

  constructor(private balanceService: BalanceService,
              private journalService: JournalService,
              private transactionService: TransactionService,
              private refTypesService: RefTypesService,
              private globals: Globals,
              private title: Title) { }

  ngOnInit(): void {
    this.title.setTitle('EVE Track - Wallet');
    this.showJournal().then();
    this.showTransactions().then();
  }

  ngAfterViewInit(): void {
    this.showBalance().then();
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

  numberformat(): string {
    return '1.2-2';
  }

  getItemInfo(typeID: string): void {
    // TODO: implement
  }

  getPersonInfo(clientID: string): void {
    // TODO: implement
  }

  async showBalance(): Promise<void> {
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

  initBalanceCountUp(balance: number): void {
    const options: CountUpOptions = {
      useEasing: false,
      suffix: ' ISK',
    };
    this.balance = new CountUp('balance-number', 0, balance, 2, 1, options);
    this.balance.start();
  }

  async showJournal(): Promise<void> {
    const refTypes = await this.refTypesService.getRefTypes();
    const refTypeData = refTypes['eveapi']['result'][0]['rowset'][0]['row'];
    this.journalData = await this.journalService.getJournal(refTypeData);
    this.journalDataRequestDone = true;
  }

  async showTransactions(): Promise<void> {
    this.transactionData = await this.transactionService.getTransactions();
    this.transactionDataRequestDone = true;
  }
}
