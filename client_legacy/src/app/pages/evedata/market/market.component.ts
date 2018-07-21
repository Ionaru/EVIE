import { Component, OnInit } from '@angular/core';
import { IOrderData, MarketService } from '../../../services/market.service';
import { INames, NamesService } from '../../../services/names.service';
import { Globals } from '../../../shared/globals';
import { Helpers } from '../../../shared/helpers';

@Component({
  providers: [MarketService],
  styleUrls: ['market.component.scss'],
  templateUrl: 'market.component.html',
})
export class MarketComponent implements OnInit {

  public orders: IOrderData[];
  public names: INames;

  constructor(private marketService: MarketService, private namesService: NamesService,
              private globals: Globals) { }

  public ngOnInit(): void {
    this.names = this.globals.names;
    this.getOrders().then();
  }

  public async getOrders(): Promise<void> {
    this.orders = await this.marketService.getOrders(this.globals.selectedCharacter);
    // this.helpers.sortArrayByObjectProperty(this.orders, 'price').slice();
    const ids = [];
    for (const order of this.orders) {
      ids.push(order.type_id);
    }
    this.namesService.getNames(...ids).then();
  }

  public formatPrice(amount) {
    return Helpers.formatAmount(amount);
  }

  public getOrderAmount(type: string): number {
    if (!this.orders) {
      return 0;
    }
    const buyOrder = type === 'buy';
    return this.orders.filter((_) => _.is_buy_order === buyOrder).length;
  }
}
