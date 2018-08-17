import { Component, OnInit } from '@angular/core';
import { faGem } from '@fortawesome/pro-regular-svg-icons';
import { faHourglass } from '@fortawesome/pro-solid-svg-icons';

import { IManufacturingData } from '../../../shared/interface.helper';
import { IndustryJobsService } from '../../data-services/industry-jobs.service';
import { IndustryService } from '../../data-services/industry.service';
import { NamesService } from '../../data-services/names.service';
import { TypesService } from '../../data-services/types.service';
import { CharacterService } from '../../models/character/character.service';
import { DataPageComponent } from '../data-page/data-page.component';

interface IManufacturingCache {
    [index: string]: IManufacturingData;
}

@Component({
    selector: 'app-industry',
    styleUrls: ['./industry.component.scss'],
    templateUrl: './industry.component.html',
})
export class IndustryComponent extends DataPageComponent implements OnInit {

    public faHourglass = faHourglass;
    public faGem = faGem;

    public bps: number[] = [];
    public bpi: any = {};

    public manufactuingCache: IManufacturingCache = {};

    constructor(private industryJobsService: IndustryJobsService, private typesService: TypesService,
                private industryService: IndustryService, private namesService: NamesService) {
        super();
    }

    public ngOnInit() {
        super.ngOnInit();
        // this.fun().then();
        this.getMats().then((mats) => {
            console.log(mats);
        });
        // if (CharacterService.selectedCharacter) {
        //     this.industryJobsService.getIndustryJobs(CharacterService.selectedCharacter).then();
        // }
        //
        // this.typesService.getTypes(34, 35).then();
    }

    public async fun() {
        const i = await this.industryService.getManufacturingData(40340);
        if (i) {
            this.bps.push(i.blueprintId);

            for (const material of i.materials) {
                const j = await this.industryService.getManufacturingData(material.id);

                if (j) {
                    this.bps.push(j.blueprintId);

                    for (const submat of j.materials) {
                        const k = await this.industryService.getManufacturingData(submat.id);

                        if (k) {
                            this.bps.push(k.blueprintId);
                        } else {
                            this.bps.push(submat.id);
                        }
                    }
                } else {
                    this.bps.push(material.id);
                }
            }
        }

        await this.namesService.getNames(...this.bps);

        for (const x of this.bps) {
            console.log(NamesService.getNameFromData(x));
        }
    }

    public async getMats(m = 12003) {

        const mats: any[] = [];

        const i = await this.industryService.getManufacturingData(m);
        if (i) {
            for (const ma of i.materials) {
                mats.push(await this.getMats(ma.id));
            }
        }

        return mats;
    }

    public async recFun(m = 12003) {
        const i = await this.industryService.getManufacturingData(m);
        if (i) {
            const firstLevelMats: IManufacturingData[] = [];

            for (const mat of i.materials) {
                const x = await this.industryService.getManufacturingData(mat.id);
                if (x) {
                    firstLevelMats.push(x);
                }
            }

            const secondLevelMats: IManufacturingData[] = [];
            let hasFurtherMats = false;

            for (const mat of firstLevelMats) {
                for (const matx of mat.materials) {
                    const y = await this.industryService.getManufacturingData(matx.id);
                    if (y) {
                        hasFurtherMats = true;
                        secondLevelMats.push(y);
                    }
                }
            }

            console.log(secondLevelMats);
        }
    }
}
