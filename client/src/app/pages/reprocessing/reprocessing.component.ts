import { Component } from '@angular/core';
import { IndustryService } from '../../data-services/industry.service';
import { NamesService } from '../../data-services/names.service';
import { SearchService } from '../../data-services/search.service';

interface IOreAmount {
    0: string;
    1: number;
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

    public structureType = 'tatara';
    public structureRigs = 't2';
    public structureLocation = 'nullsec';
    public implantLevel = 0;
    public tax = 0;

    public skillValues = {
        reprocessing: 5,
        reprocessingEfficiency: 5,
        averageOreProcessing: 4,
    };

    public efficiency = 0;

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

    public inputToAmounts(input: string[]): IOreAmount[] {

        const amounts: IOreAmount[] = [];

        for (const line of input) {
            const lineParts = line.split(' ');
            const amountText = (lineParts.pop() || '0').replace(/,/g, '');
            const amount = isNaN(Number(amountText)) ? 0 : Number(amountText);
            const item = lineParts.join(' ');

            amounts.push([item, amount]);
        }

        return amounts;
    }

    public getLocationEfficiencyBonus(): number {
        switch (this.structureLocation) {
            case 'highsec':
                return 0;
            case 'lowsec':
                return 0.06;
            case 'nullsec':
                return 0.12;
        }
        return 0;
    }

    public getRigsEfficiencyBonus(): number {
        switch (this.structureRigs) {
            case 't0':
                return 0;
            case 't1':
                return 1;
            case 't2':
                return 3;
        }
        return 0;
    }

    public getStructureEfficiencyBonus(): number {
        switch (this.structureType) {
            case 'citadel':
                return 0;
            case 'athanor':
                return 0.02;
            case 'tatara':
                return 0.04;
        }
        return 0;
    }

    public getEfficiency(): number {
        // Structure
        let efficiency = 50 + this.getRigsEfficiencyBonus();
        efficiency += efficiency * (this.getLocationEfficiencyBonus());
        efficiency += efficiency * (this.getStructureEfficiencyBonus());

        // Skills
        efficiency += (efficiency * ((this.skillValues.reprocessing * 3) / 100));
        efficiency += (efficiency * ((this.skillValues.reprocessingEfficiency * 2) / 100));
        efficiency += (efficiency * ((this.skillValues.averageOreProcessing * 2) / 100));

        // Implant
        efficiency += (efficiency * ((this.implantLevel) / 100));

        // Tax
        efficiency -= (efficiency * (this.tax / 100));

        this.efficiency = efficiency;
        return efficiency;
    }

    public async run(): Promise<void> {
        this.buttonDisabled = true;

        const input = this.cleanInput(this.oreText);
        const amounts = this.inputToAmounts(input);

        this.refiningData = {};
        const tempRefiningData: IReprocessingData = {};

        for (const amountsRow of amounts) {
            const name = amountsRow[0];
            const amount = amountsRow[1];

            const type = await this.searchService.search(name, 'type');
            if (!type) {
                continue;
            }

            const refiningProducts = await this.industryService.getRefiningProducts(type.id);
            for (const product of refiningProducts) {

                product.quantity = (product.quantity * amount);

                if (!name.toLowerCase().includes('compressed')) {
                    product.quantity = product.quantity / 100;
                }

                product.quantity = product.quantity * (this.getEfficiency() / 100);

                if (tempRefiningData[product.id]) {
                    tempRefiningData[product.id] += product.quantity;
                } else {
                    tempRefiningData[product.id] = product.quantity;
                }
            }

            for (const id of Object.keys(tempRefiningData)) {
                tempRefiningData[id] = Math.floor(tempRefiningData[id]);
            }

        }

        const mineralIds = Object.keys(tempRefiningData);
        await this.namesService.getNames(...mineralIds);

        this.refiningData = tempRefiningData;

        this.buttonDisabled = false;
    }

}
