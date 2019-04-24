import { Component, OnInit } from '@angular/core';
import { sortArrayByObjectProperty } from '@ionaru/array-utils';
import { IAmountOfItem } from '../../../shared/interface.helper';

import { IndustryService } from '../../data-services/industry.service';
import { MarketService } from '../../data-services/market.service';

@Component({
  selector: 'app-industry-calculator',
  styleUrls: ['./industry-calculator.component.scss'],
  templateUrl: './industry-calculator.component.html',
})
export class IndustryCalculatorComponent implements OnInit {

  constructor(
      private industryService: IndustryService,
      private marketService: MarketService,
  ) { }

// Voor item x
//
// TODO: Bereken bouw benodigdheden met ME level y
//
// TODO: Bereken inkoop kosten van tier-1 componenten (zoek laagste prijzen)
//
// Zoek kosten van productie gebaseerd op locatie.
//
// TODO: Zoek top 3 verkoopprijs van item
//
// TODO: Bereken winst

  public ngOnInit() {
      this.calculateProfit(23563, 30021392).then();
  }

  public async calculateProfit(itemID: number, manufacturingSystemId: number) {

      const amount = 1;
      const structureRoleBonus = 0.05;
      const facilityTax = 0.008;

      const manufacturingData = await this.industryService.getManufacturingData(itemID);

      if (!manufacturingData) {
          return;
      }

      const requiredMaterials = manufacturingData.materials;

      let estimatedItemValue = 0;
      for (const material of requiredMaterials) {
          estimatedItemValue += await this.getPrice(material);
      }

      estimatedItemValue = estimatedItemValue * amount;

      console.log('Estimated Items Value', estimatedItemValue);

      const systemData = await this.industryService.getSystemCostIndices(manufacturingSystemId);

      if (systemData) {
          const systemCostIndex = systemData.cost_indices.filter((index) => index.activity === 'manufacturing')[0].cost_index;
          const systemTax = estimatedItemValue * systemCostIndex;
          console.log(`System Cost Index (${systemCostIndex * 100}%)`, systemTax);
          console.log('Structure Role Bonus', systemTax * structureRoleBonus);
          const grossCost = systemTax - (systemTax * structureRoleBonus);
          console.log('Job Gross Cost', grossCost);
          const totalCost = grossCost + (grossCost * facilityTax);
          console.log('Facility Tax', grossCost * facilityTax);
          console.log('Total Job Cost', totalCost);

          let materialCost = 0;
          for (const material of requiredMaterials) {
              materialCost += await this.getPriceForComponent(material);
          }
          console.log('COST', materialCost);

          const productionCost = totalCost + materialCost;

          const sellPrice = await this.getProductSellPrice(itemID);
          const buyPrice = await this.getProductBuyPrice(itemID);
          console.log('SELLPRICE', sellPrice);
          console.log('BUYPRICE', buyPrice);

          // const profit = sellPrice - productionCost;
          console.log('PROFIT SELL', sellPrice - productionCost);
          console.log('PROFIT BUY', buyPrice - productionCost);
      }
  }

  private async getPrice(material: IAmountOfItem): Promise<number> {
      const priceData = await this.marketService.getMarketPrice(material.id);

      if (!priceData || !priceData.adjusted_price) {
          return Infinity;
      }

      return priceData.adjusted_price * material.quantity;
  }

    private async getProductBuyPrice(productId: number): Promise<number> {
        const orders = await this.marketService.getMarketOrders(10000002, productId, 'buy');

        if (!orders || !orders.length) {
            return 0;
        }

        sortArrayByObjectProperty(orders, 'price', true);
        return orders[0].price;
    }

  private async getProductSellPrice(productId: number): Promise<number> {
      const orders = await this.marketService.getMarketOrders(10000002, productId, 'sell');

      if (!orders || !orders.length) {
          return 0;
      }

      sortArrayByObjectProperty(orders, 'price');
      return orders[0].price;
  }

  private async getPriceForComponent(material: IAmountOfItem): Promise<number> {
      const orders = await this.marketService.getMarketOrders(10000002, material.id, 'sell');

      if (!orders) {
          return Infinity;
      }

      sortArrayByObjectProperty(orders, 'price');

      let price = 0;
      let unitsLeft = material.quantity;
      for (const order of orders) {
          const amountFromThisOrder = Math.min(order.volume_remain, unitsLeft);
          price += amountFromThisOrder * order.price;
          unitsLeft -= amountFromThisOrder;
          if (!unitsLeft) {
              break;
          }
      }

      if (unitsLeft) {
          return Infinity;
      }

      return price;
  }

  // Bouncer I: 23563
    // Mat lvl 10
    // Time lvl 20

    // EIV = [component_cost*price]

    // public async getPriceForVolume(ore: number, orders: IMarketOrdersResponse[], volume: number, buy = true) {
    //     const buyOrders = orders.filter((order) => order.is_buy_order === buy);
    //     sortArrayByObjectProperty(buyOrders, 'price', buy);
    //     const buySell = buy ? 'buy' : 'sell';
    //
    //     const type = this.oreTypes[ore];
    //
    //     if (!type) {
    //         this.orePrices[buySell][ore] = -1;
    //         return;
    //     }
    //
    //     const veldVolume = type.volume;
    //     const cargoCap = volume;
    //
    //     let price = 0;
    //     let unitsLeft = cargoCap / veldVolume;
    //     for (const order of buyOrders) {
    //         const amountFromThisOrder = Math.min(order.volume_remain, unitsLeft);
    //
    //         price += amountFromThisOrder * order.price;
    //         unitsLeft -= amountFromThisOrder;
    //
    //         if (!unitsLeft) {
    //             break;
    //         }
    //     }
    //
    //     if (unitsLeft) {
    //         this.orePrices[buySell][ore] = price / unitsLeft;
    //         return;
    //     }
    //
    //     this.orePrices[buySell][ore] = price / cargoCap;
    // }

}
