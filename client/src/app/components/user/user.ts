import { Account } from '../account/account';

export class User {
  username: string;
  email: string;
  accounts: Array<Account>;
  selectedAccount: number = 0;

  fillData(dataFromServer: Object): void {
    this.username = dataFromServer['username'];
    this.email = dataFromServer['email'];
    this.accounts = dataFromServer['accounts'];
  }
}
