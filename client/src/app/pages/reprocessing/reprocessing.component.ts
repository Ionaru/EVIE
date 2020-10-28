import { Component } from '@angular/core';
import { IndustryService } from '../../data-services/industry.service';
import { NamesService } from '../../data-services/names.service';
import { SearchService } from '../../data-services/search.service';

interface IOreAmount {
    [key: string]: number;
}

interface IReprocessingData {
    [key: string]: number;
}

@Component({
    selector: 'app-reprocessing',
    styleUrls: ['./reprocessing.component.scss'],
    templateUrl: './reprocessing.component.html',
})
export class ReprocessingComponent {

    public refiningData: IReprocessingData = {};

    public buttonDisabled = false;

    public refineryValues = {
        base: 57,
        tax: 0,
        implants: 0,
    };

    public skillValues = {
        reprocessing: 5,
        reprocessingEfficiency: 5,
        averageOreProcessing: 5,
    };

    public oreText = '';

    public constructor(
        private readonly industryService: IndustryService,
        private namesService: NamesService,
        private searchService: SearchService,
    ) { }

    public getName(id: string): string {
        return NamesService.getNameFromData(Number(id));
    }

    public isNotEmpty() {
        return !!Object.keys(this.refiningData).length;
    }

    public cleanInput(raw: string): string[] {
        return raw
            // Replace line breaks for cross-platform use.
            .replace(/\r\n/g, '\n')
            // Replace tabs with spaces
            .replace(/\t/g, ' ')
            // Split into lines.
            .split('\n')
            // Remove everything after first digits (amount).
            .map((line) => {
                const match = line.match(/^[A-z ]* [\d,]*/);
                return match ? match[0] : '';
            })
            // Trim leading / trailing spaces.
            .map((line) => line.trim())
            // Remove blank lines.
            .filter((line) => line !== '');
    }

    public inputToAmounts(input: string[]): IOreAmount {

        const amounts: IOreAmount = {};

        for (const line of input) {
            const lineParts = line.split(' ');
            const amountText = (lineParts.pop() || '0').replace(/,/g, '');
            const amount = isNaN(Number(amountText)) ? 0 : Number(amountText);
            const item = lineParts.join(' ');

            if (amounts[item]) {
                amounts[item] += amount;
            } else {
                amounts[item] = amount;
            }
        }

        return amounts;
    }

    public async run(): Promise<void> {
        this.buttonDisabled = true;

        const input = this.cleanInput(this.oreText);
        const amounts = this.inputToAmounts(input);

        this.refiningData = {};
        const tempRefiningData: IReprocessingData = {};

        for (const [name, amount] of Object.entries(amounts)) {

            const type = await this.searchService.search(name, 'type');
            if (!type) {
                continue;
            }

            const refiningProducts = await this.industryService.getRefiningProducts(type.id);
            for (const product of refiningProducts) {

                product.quantity = (product.quantity * amount) / 100;

                // TODO: Adjust for %

                if (tempRefiningData[product.id]) {
                    tempRefiningData[product.id] += product.quantity;
                } else {
                    tempRefiningData[product.id] = product.quantity;
                }
            }

        }

        const mineralIds = Object.keys(tempRefiningData);
        await this.namesService.getNames(...mineralIds);

        this.refiningData = tempRefiningData;

        this.buttonDisabled = false;
    }

}
