import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { faInfoCircle, faSort, faSortDown, faSortUp } from '@fortawesome/pro-solid-svg-icons';
import { sortArrayByObjectProperty } from '@ionaru/array-utils';

export interface ITableHeader<T> {
    attribute: keyof T;
    sortAttribute?: keyof T;
    classFunction?: (value: T) => string;
    dataFunction?: (value: T) => any;
    hint?: string;
    pipe?: 'number' | 'date';
    pipeVar?: string;
    prefix?: string;
    prefixFunction?: (value: T) => string;
    title?: string;
    sort?: boolean;
    suffix?: string;
    suffixFunction?: (value: T) => string;
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

    @Input() public columns: Array<ITableHeader<ITableData>> = [];
    @Input() public data?: ITableData[];

    public currentSort?: ITableHeader<ITableData>;
    public invert = false;

    public sortAscendingIcon = faSortUp;
    public sortDescendingIcon = faSortDown;
    public noSortIcon = faSort;
    public hintIcon = faInfoCircle;

    public getData(column: ITableHeader<ITableData>, data: ITableData) {
        const attribute = column.attribute.toString();
        const dataValue = attribute.split('.').reduce((o, i) => o ? o[i] : o, data);
        return column.dataFunction ? column.dataFunction(data) : dataValue;
    }

    public sort(column = this.currentSort) {
        if (!column || !this.data) {
            return;
        }

        const sortAttribute = (column.sortAttribute || column.attribute).toString();

        this.invert = (this.currentSort && this.currentSort === column) ? !this.invert : false;

        sortArrayByObjectProperty(this.data, sortAttribute, this.invert);
        this.currentSort = column;
    }

    public getClass(column: ITableHeader<ITableData>, data: ITableData) {
        return column.classFunction ? column.classFunction(data) : '';
    }

    public prefixFunction(column: ITableHeader<ITableData>, data: ITableData) {
        return column.prefixFunction ? column.prefixFunction(data) : undefined;
    }

    public suffixFunction(column: ITableHeader<ITableData>, data: ITableData) {
        return column.suffixFunction ? column.suffixFunction(data) : undefined;
    }

    public ngOnChanges(change: SimpleChanges) {
        if (change.data) {
            this.invert = !this.invert;
            this.sort();
        }
    }
}
