export class Character {
  id: number;
  name: string;
  accessToken: string;
  expiry: Date;
  corporation_id: number;
  corporation: string;
  alliance_id: number;
  alliance: string;
  race: string;
  bloodline: string;
  ancestory: string;
  balance: number = 0;
  walletJournal: Array<Object> = [];
  walletTransactions: Array<Object> = [];
  currentlyTraining: number = 0;
  skillQueue: Array<number> = [];
  assets: Array<Object> = [];
  planets: Array<Object> = [];
  mails: Array<Object> = [];

  constructor(id: number, name: string) {
    this.id = id;
    this.name = name;
    // let result;
    // let service = new EveAPIService();
    // service.getFromAPI(account.keyID, account.vCode, id).subscribe(result =>
    //   console.log(result["result"]["rowset"]["row"])
    // );
    // await this.getCharacterDetails(account.keyID, account.vCode, id);
  }

  getCharacterDetails(keyID: number, vCode: string, id: number): void {
    // console.log()
  }
}
