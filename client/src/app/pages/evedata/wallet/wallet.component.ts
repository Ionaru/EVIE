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
  balanceData: string;
  journalData: Array<Object>;
  transactionData: Array<Object>;

  constructor(private balance: BalanceService,
              private journal: JournalService,
              private transactions: TransactionService,
              private reftypes: RefTypesService,
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
    this.balance.getBalance().subscribe((balance) => {
      let options: CountUpOptions = {
        useEasing : false,
      };
      let countUp = new CountUp('balance-number', 0, Number(balance), 2, 1, options);
      countUp.start();
    });
  }

  showJournal(): void {
    this.reftypes.getRefTypes().subscribe((refTypes) => {
      let refTypeData = refTypes['eveapi']['result']['rowset']['row'];
      this.journal.getJournal(refTypeData).subscribe((journalData) => {
        this.journalData = journalData;
      });
    });
  }

  showTransactions(): void {
    this.transactions.getTransactions().subscribe((transactions) => {
      this.transactionData = transactions;
    });
  }
}