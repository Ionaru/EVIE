import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { generateNumbersArray, sortArrayByObjectProperty } from '@ionaru/array-utils';
import { EVE, IMarketOrdersData } from '@ionaru/eve-utils';

import { BaseService, IServerResponse } from './base.service';
import { ConstellationsService } from './constellations.service';
import { SystemsService } from './systems.service';

@Injectable()
export class MarketService extends BaseService {

    private static getPriceForOrderAmount(orders: IMarketOrdersData, amount: number) {
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

    constructor(
        protected http: HttpClient,
        private systemsService: SystemsService,
        private constellationsService: ConstellationsService,
    ) {
        super(http);
    }

    public async getEstimatedItemValue(itemId: number): Promise<number | void> {

        const url = `data/estimated-item-value/${itemId}`;
        const response = await this.http.get<any>(url).toPromise<IServerResponse<number>>()
            .catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return;
        }

        return response.data;
    }

    public async getPriceForAmountInSystem(systemId: number, typeId: number, amount: number, type: 'buy' | 'sell' = 'sell') {

        const systemOrders = await this.getMarketOrderInSystem(systemId, typeId, type);
        if (!systemOrders) {
            return;
        }

        sortArrayByObjectProperty(systemOrders, (order) => order.price, type === 'buy');
        return MarketService.getPriceForOrderAmount(systemOrders, amount);
    }

    public async getPriceForAmount(regionId: number, typeId: number, amount: number, type: 'buy' | 'sell' = 'sell'):
        Promise<number | undefined> {

        const orders = await this.getMarketOrders(regionId, typeId, type);
        if (!orders) {
            return;
        }

        sortArrayByObjectProperty(orders, (order) => order.price, type === 'buy');
        return MarketService.getPriceForOrderAmount(orders, amount);
    }

    public async getMarketOrderInSystem(systemId: number, typeId: number, type: 'buy' | 'sell' = 'sell') {
        const systemInfo = await this.systemsService.getSystemInfo(systemId);
        if (!systemInfo) {
            return;
        }

        const constellationInfo = await this.constellationsService.getConstellation(systemInfo.constellation_id);
        if (!constellationInfo) {
            return;
        }

        const orders = await this.getMarketOrders(constellationInfo.region_id, typeId, type);
        if (!orders) {
            return;
        }

        return orders.filter((order) => order.system_id === systemId);
    }

    public async getMarketOrders(regionId: number, typeId: number, type: 'buy' | 'sell' | 'all' = 'all'):
        Promise<IMarketOrdersData | undefined> {

        const response = await this.getMarketOrdersPage(regionId, typeId, 1, type);
        if (!response) {
            return;
        }

        const orders = response.body || [];

        if (response.headers.has(BaseService.pagesHeaderName)) {
            const pages = Number(response.headers.get(BaseService.pagesHeaderName));
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
        const url = EVE.getMarketOrdersUrl({regionId, typeId, page, orderType: type});

        const response = await this.http.get<any>(url, {observe: 'response'})
            .toPromise<HttpResponse<IMarketOrdersData>>()
            .catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return;
        }

        return response || undefined;
    }
}
