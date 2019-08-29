import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { generateNumbersArray, sortArrayByObjectProperty } from '@ionaru/array-utils';
import { EVE, IMarketOrdersData } from '@ionaru/eve-utils';

import { BaseService } from './base.service';

@Injectable()
export class MarketService extends BaseService {

    public async getPriceForAmount(regionId: number, typeId: number, amount: number, type: 'buy' | 'sell' = 'sell'):
        Promise<number | undefined> {
        const orders = await this.getMarketOrders(regionId, typeId, type);

        if (!orders) {
            return;
        }

        sortArrayByObjectProperty(orders, 'price', type === 'buy');

        let price = 0;
        let unitsLeft = amount;

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

    public async getMarketOrders(regionId: number, typeId: number, type: 'buy' | 'sell' | 'all' = 'all'):
        Promise<IMarketOrdersData | undefined> {

        const response = await this.getMarketOrdersPage(regionId, typeId, 1, type);

        if (!response) {
            return;
        }

        const orders = response.body || [];

        if (response.headers.has('x-pages')) {
            const pages = Number(response.headers.get('x-pages'));
            if (pages > 1) {
                const pageIterable = generateNumbersArray(pages, 2);

                await Promise.all(pageIterable.map(async (page) => {
                    const pageResponse = await this.getMarketOrdersPage(regionId, typeId, page, type);
                    if (pageResponse && pageResponse.body) {
                        orders.push(...pageResponse.body);
                    }
                }));
            }
        }

        return orders;
    }

    private async getMarketOrdersPage(regionId: number, typeId: number, page: number, type: 'buy' | 'sell' | 'all' = 'all'):
        Promise<HttpResponse<IMarketOrdersData> | undefined> {
        const url = EVE.getMarketOrdersUrl(regionId, typeId, page, type);

        const response = await this.http.get<any>(url, {observe: 'response'})
            .toPromise<HttpResponse<IMarketOrdersData>>()
            .catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return;
        }

        return response || undefined;
    }
}
