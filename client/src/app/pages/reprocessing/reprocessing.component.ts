import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { faEyeSlash, faUserLock, faUserSlash } from '@fortawesome/pro-regular-svg-icons';
import { faUser } from '@fortawesome/pro-solid-svg-icons';

import { IndustryService } from '../../data-services/industry.service';
import { NamesService } from '../../data-services/names.service';
import { SearchService } from '../../data-services/search.service';
import { SkillsService } from '../../data-services/skills.service';
import { TypesService } from '../../data-services/types.service';
import { CharacterService } from '../../models/character/character.service';
import { getAffectingSkillId } from '../../shared/ore-skill-map';
import { createTitle } from '../../shared/title';
import { Scope } from '../scopes/scopes.component';

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

    public useCharacterSkills = false;

    public characterIcon = faUser;
    public characterDisabledIcon = faUserSlash;
    public missingScopeIcon = faEyeSlash;
    public notLoggedInIcon = faUserLock;

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
    public efficiencyList: number[] = [];

    public oreText = '';

    public constructor(
        private readonly industryService: IndustryService,
        private namesService: NamesService,
        private searchService: SearchService,
        private skillsService: SkillsService,
        private title: Title,
        private typesService: TypesService,
    ) {
        this.title.setTitle(createTitle('Reprocessing'));
        CharacterService.characterChangeEvent.subscribe(() => {
            this.useCharacterSkills = false;
        });
    }

    public getCharacterName() {
        return CharacterService.selectedCharacter && CharacterService.selectedCharacter.name;
    }

    public isLoggedIn() {
        return !!CharacterService.selectedCharacter;
    }

    public hasScopes() {
        return CharacterService.selectedCharacter && CharacterService.selectedCharacter.hasScope(Scope.SKILLS);
    }

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
            .map((line) => line.replace(/(?: \d+ ).*/g, ''))
            // Trim leading / trailing spaces.
            .map((line) => line.trim())
            // Remove blank lines.
            .filter((line) => line !== '');
    }

    public inputToAmounts(input: string[]): IOreAmount[] {

        const amounts: IOreAmount[] = [];

        for (const line of input) {
            const lineParts = line.split(' ');
            if (lineParts.length === 1) {
                amounts.push([lineParts[0], 1]);
                continue;
            }

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

    public async getOreEfficiency(affectingSkill: number): Promise<number> {

        // Structure
        let efficiency = 50 + this.getRigsEfficiencyBonus();
        efficiency += efficiency * (this.getLocationEfficiencyBonus());
        efficiency += efficiency * (this.getStructureEfficiencyBonus());

        // Skills
        if (this.useCharacterSkills && CharacterService.selectedCharacter && CharacterService.selectedCharacter.hasScope(Scope.SKILLS)) {
            const skills = await this.skillsService.getSkillsData(CharacterService.selectedCharacter);
            if (skills?.skills) {
                const processingSkill = skills.skills.find((skill) => skill.skill_id === 3385);
                const efficiencySkill = skills.skills.find((skill) => skill.skill_id === 3389);
                const oreSkill = skills.skills.find((skill) => skill.skill_id === affectingSkill);

                this.skillValues.reprocessing = processingSkill?.active_skill_level || 0;
                this.skillValues.reprocessingEfficiency = efficiencySkill?.active_skill_level || 0;
                this.skillValues.averageOreProcessing = oreSkill?.active_skill_level || 0;
            }
        }

        efficiency += (efficiency * ((this.skillValues.reprocessing * 3) / 100));
        efficiency += (efficiency * ((this.skillValues.reprocessingEfficiency * 2) / 100));
        efficiency += (efficiency * ((this.skillValues.averageOreProcessing * 2) / 100));

        // Implant
        efficiency += (efficiency * ((this.implantLevel) / 100));

        return efficiency;
    }

    public async getScrapMetalEfficiency() {

        // Structure
        let efficiency = 50;

        // Skills
        if (this.useCharacterSkills && CharacterService.selectedCharacter && CharacterService.selectedCharacter.hasScope(Scope.SKILLS)) {
            const skills = await this.skillsService.getSkillsData(CharacterService.selectedCharacter);
            if (skills?.skills) {
                const oreSkill = skills.skills.find((skill) => skill.skill_id === 12196);
                this.skillValues.averageOreProcessing = oreSkill?.active_skill_level || 0;
            }
        }

        efficiency += (efficiency * ((this.skillValues.averageOreProcessing * 2) / 100));

        return efficiency;
    }

    public async getEfficiency(id: number): Promise<number> {

        const affectingSkill = getAffectingSkillId(id);
        let efficiency = affectingSkill === 12196 ? await this.getScrapMetalEfficiency() : await this.getOreEfficiency(affectingSkill);

        // Tax
        efficiency -= (efficiency * (this.tax / 100));

        this.efficiencyList.push(efficiency);
        return efficiency;
    }

    public async run(): Promise<void> {
        this.buttonDisabled = true;

        const input = this.cleanInput(this.oreText);
        const amounts = this.inputToAmounts(input);

        this.refiningData = {};
        this.efficiencyList = [];
        const skillValuesBackup = {...this.skillValues};
        const tempRefiningData: IReprocessingData = {};

        for (const amountsRow of amounts) {
            const name = amountsRow[0];
            const amount = amountsRow[1] || 1;

            const type = await this.searchService.search(name, 'type');
            if (!type) {
                continue;
            }

            const typeInformation = await this.typesService.getType(type.id);
            if (!typeInformation) {
                continue;
            }

            const refiningProducts = await this.industryService.getRefiningProducts(type.id);
            for (const product of refiningProducts) {

                product.quantity = (product.quantity * amount);
                product.quantity = product.quantity / (typeInformation.portion_size || 1);
                product.quantity = product.quantity * (await this.getEfficiency(type.id) / 100);

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
        const totalEfficiency = this.efficiencyList.reduce((acc, cv) => acc + cv, 0) / this.efficiencyList.length;
        this.efficiency = Math.round(totalEfficiency * 100) / 100;
        this.skillValues = {...skillValuesBackup};

        this.buttonDisabled = false;
    }

}
