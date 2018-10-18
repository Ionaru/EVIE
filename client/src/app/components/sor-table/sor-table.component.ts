import { Component, Input } from '@angular/core';
import { faInfoCircle, faSort, faSortDown, faSortUp } from '@fortawesome/pro-solid-svg-icons';

import { Common } from '../../../shared/common.helper';

export interface ITableHeader {
    attribute: string;
    classFunction?: (value: any) => string;
    hint?: string;
    pipe?: 'number' | 'date';
    pipeVar?: string;
    prefix?: string;
    title?: string;
    sort?: boolean;
    suffix?: string;
}

export interface ITableData {
    [index: string]: any;
}

@Component({
    selector: 'app-sor-table',
    styleUrls: ['./sor-table.component.scss'],
    templateUrl: './sor-table.component.html',
})
export class SorTableComponent {

    @Input() public columns: ITableHeader[] = [];
    @Input() public data: ITableData[] = [];

    public currentSort?: string;
    public invert = false;

    public sortAscendingIcon = faSortUp;
    public sortDescendingIcon = faSortDown;
    public noSortIcon = faSort;
    public hintIcon = faInfoCircle;

    public getData = (attribute: string, data: ITableData) => attribute.split('.').reduce((o, i) =>  o ? o[i] : o, data);

    public sort(attribute: string) {
        this.invert = this.currentSort && this.currentSort === attribute ? !this.invert : false;

        Common.sortArrayByObjectProperty(this.data, attribute, this.invert);
        this.currentSort = attribute;
    }

    public getClass(col: ITableHeader, data: any) {
        return col.classFunction ? col.classFunction(this.getData(col.attribute, data)) : '';
    }
}
