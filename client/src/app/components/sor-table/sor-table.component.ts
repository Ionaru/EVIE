import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { faInfoCircle, faSort, faSortDown, faSortUp } from '@fortawesome/pro-solid-svg-icons';
import { sortArrayByObjectProperty } from '@ionaru/array-utils';

export interface ITableData {
    [index: string]: any;
}

export interface ITableHeader<T extends ITableData> {
    attribute: keyof T;
    attributeFunction?: (value: T) => any;
    classFunction?: (value: T) => string;
    hint?: string;
    pipe?: 'number' | 'date';
    pipeVar?: string;
    prefix?: string;
    prefixFunction?: (value: T) => string;
    sort?: boolean;
    sortAttribute?: keyof T;
    suffix?: string;
    suffixFunction?: (value: T) => string;
    title?: string;
    titleClass?: string;
}

@Component({
    selector: 'app-sor-table',
    styleUrls: ['./sor-table.component.scss'],
    templateUrl: './sor-table.component.html',
})
export class SorTableComponent implements OnChanges {

    @Input() public columns: ITableHeader<ITableData>[] = [];
    @Input() public data?: ITableData[];

    public currentSort?: ITableHeader<ITableData>;
    public invert = false;

    public sortAscendingIcon = faSortUp;
    public sortDescendingIcon = faSortDown;
    public noSortIcon = faSort;
    public hintIcon = faInfoCircle;

    public getData(column: ITableHeader<ITableData>, data: ITableData) {
        return column.attributeFunction ? column.attributeFunction(data) : data[column.attribute];
    }

    public sort(column = this.currentSort) {
        if (!column || !this.data) {
            return;
        }

        const sortAttribute = column.sortAttribute || column.attribute;

        this.invert = (this.currentSort && this.currentSort === column) ? !this.invert : false;

        sortArrayByObjectProperty(this.data, (item) => item[sortAttribute], this.invert);
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

    public capitalize(key: keyof ITableData): string {
        const name = key.toString();
        return name.charAt(0).toUpperCase() + name.slice(1);
    }
}
