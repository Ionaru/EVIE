import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { BalanceService } from './balance.service';
import { JournalService } from './journal.service';
import { TransactionService } from './transactions.service';
import { RefTypesService } from './reftypes.service';

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

  ngOnInit() {
    this.title.setTitle('EVE Track - Wallet');
    this.showBalance();
    this.showJournal();
    this.showTransactions();
  }

  getNumberColor(amount) {
    if (amount.indexOf('-') > -1) {
      return 'negative';
    } else if (amount === '0,00') {
      return '';
    } else {
      return 'positive';
    }
  }

  buyOrSell(value) {
    if (value === 'buy') {
      return 'negative';
    }
    return 'positive';
  }

  getItemInfo(typeID: string) {
    // TODO: implement
  }

  getPersonInfo(clientID: string) {
    // TODO: implement
  }

  showBalance() {
    this.balance.getBalance().subscribe((balance) => {
      this.balanceData = balance;
    });
  }

  showJournal() {
    this.reftypes.getRefTypes().subscribe((refTypes) => {
      this.journal.getJournal(refTypes).subscribe((journalData) => {
        this.journalData = journalData;
      });
    });
  }

  showTransactions() {
    this.transactions.getTransactions().subscribe((transactions) => {
      this.transactionData = transactions;
    });
  }
}
