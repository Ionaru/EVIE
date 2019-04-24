import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { generateNumbersArray } from '@ionaru/array-utils';

import { EVE } from '../../shared/eve.helper';
import { IMarketOrdersResponse, IMarketPriceData, IServerResponse } from '../../shared/interface.helper';
import { BaseService } from './base.service';

@Injectable()
export class MarketService extends BaseService {

    public async getMarketPrice(typeId: number): Promise<IMarketPriceData | undefined> {

        const url = `data/market-price/${typeId}`;
        const response = await this.http.get<any>(url)
            .toPromise<IServerResponse<IMarketPriceData>>()
            .catch(this.catchHandler);

        if (response instanceof HttpErrorResponse || !response.data) {
            return;
        }

        return response.data;
    }

    public async getMarketOrders(regionId: number, typeId: number, type: 'buy' | 'sell' | 'all' = 'all'):
        Promise<IMarketOrdersResponse[] | undefined> {

        const response = await this.getMarketOrdersPage(regionId, typeId, 1, type);

        if (!response) {
            return;
        }

        const orders = response.body || [];

        if (response.headers.has('x-pages')) {
            const pages = Number(response.headers.get('x-pages'));
            if (pages > 1) {
                const pageIterable = generateNumbersArray(pages);
                pageIterable.shift();

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
        Promise<HttpResponse<IMarketOrdersResponse[]> | undefined> {
        const url = EVE.getMarketOrdersURL(regionId, typeId, page, type);

        const response = await this.http.get<any>(url, {observe: 'response'})
            .toPromise<HttpResponse<IMarketOrdersResponse[]>>()
            .catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return;
        }

        return response || undefined;
    }
}
