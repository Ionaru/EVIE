import { Component, OnInit } from '@angular/core';
import { MarketService, OrderData } from '../../../services/market.service';
import { Globals } from '../../../shared/globals';
import { Names, NamesService } from '../../../services/names.service';
import { Helpers } from '../../../shared/helpers';

@Component({
  templateUrl: 'market.component.html',
  styleUrls: ['market.component.scss'],
  providers: [MarketService],
})
export class MarketComponent implements OnInit {

  orders: Array<OrderData>;
  names: Names;

  constructor(private marketService: MarketService, private namesService: NamesService,
              private globals: Globals, private helpers: Helpers) { }

  ngOnInit(): void {
    this.names = this.globals.names;
    this.getOrders().then();
  }

  async getOrders(): Promise<void> {
    this.orders = await this.marketService.getOrders(this.globals.selectedCharacter);
    // this.helpers.sortArrayByObjectProperty(this.orders, 'price').slice();
    const ids = [];
    for (const order of this.orders) {
      ids.push(order.type_id);
    }
    this.namesService.getNames(...ids).then();
  }

  formatPrice(number) {
    return Helpers.formatAmount(number);
  }
}
