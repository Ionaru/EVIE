import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { faInfoCircle, faSort, faSortDown, faSortUp } from '@fortawesome/pro-solid-svg-icons';

import { Common } from '../../../shared/common.helper';

export interface ITableHeader {
    attribute: string;
    sortAttribute?: string;
    classFunction?: (value: any) => string;
    hint?: string;
    pipe?: 'number' | 'date';
    pipeVar?: string;
    prefix?: string;
    prefixFunction?: (value: any) => string;
    title?: string;
    sort?: boolean;
    suffix?: string;
    suffixFunction?: (value: any) => string;
}

export interface ITableData {
    [index: string]: any;
}

@Component({
    selector: 'app-sor-table',
    styleUrls: ['./sor-table.component.scss'],
    templateUrl: './sor-table.component.html',
})
export class SorTableComponent implements OnChanges {

    @Input() public columns: ITableHeader[] = [];
    @Input() public data: ITableData[] = [];

    public currentSort?: ITableHeader;
    public invert = false;

    public sortAscendingIcon = faSortUp;
    public sortDescendingIcon = faSortDown;
    public noSortIcon = faSort;
    public hintIcon = faInfoCircle;

    public getData = (attribute: string, data: ITableData) => attribute.split('.').reduce((o, i) =>  o ? o[i] : o, data);

    public sort(col = this.currentSort) {
        if (!col) {
            return;
        }

        const sortAttribute = col.sortAttribute || col.attribute;

        this.invert = (this.currentSort && this.currentSort === col) ? !this.invert : false;

        Common.sortArrayByObjectProperty(this.data, sortAttribute, this.invert);
        this.currentSort = col;
    }

    public getClass = (col: ITableHeader, data: any) => col.classFunction ? col.classFunction(data) : '';

    public prefixFunction = (col: ITableHeader, data: any) => col.prefixFunction ? col.prefixFunction(data) : undefined;
    public suffixFunction = (col: ITableHeader, data: any) => col.suffixFunction ? col.suffixFunction(data) : undefined;

    public ngOnChanges(change: SimpleChanges) {
        if (change.data) {
            this.invert = !this.invert;
            this.sort();
        }
    }
}
