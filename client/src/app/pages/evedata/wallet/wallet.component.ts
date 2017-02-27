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

  constructor(private balanceService: BalanceService,
              private journalService: JournalService,
              private transactionService: TransactionService,
              private refTypesService: RefTypesService,
              private title: Title) { }

  ngOnInit(): void {
    this.title.setTitle('EVE Track - Wallet');
    this.showBalance();
    this.showJournal();
    this.showTransactions();
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

  showBalance(): void {
    this.balanceService.getBalance().subscribe((balance) => {
      const options: CountUpOptions = {
        useEasing: false,
      };
      const countUp = new CountUp('balance-number', 0, Number(balance), 2, 1, options);
      countUp.start();
    });
  }

  showJournal(): void {
    this.refTypesService.getRefTypes().subscribe((refTypes) => {
      const refTypeData = refTypes['eveapi']['result']['rowset']['row'];
      this.journalService.getJournal(refTypeData).subscribe((journalData) => {
        this.journalData = journalData;
        this.journalDataRequestDone = true;
      });
    });
  }

  showTransactions(): void {
    this.transactionService.getTransactions().subscribe((transactions) => {
      this.transactionData = transactions;
      this.transactionDataRequestDone = true;
    });
  }
}
