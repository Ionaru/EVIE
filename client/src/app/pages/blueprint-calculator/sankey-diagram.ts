// @ts-ignore
import * as PlotlyJS from 'plotly.js';

export class SankeyDiagram {

    private _layout: Partial<PlotlyJS.Layout>;

    constructor(layout: Partial<PlotlyJS.Layout>) {
        this._layout = layout;

    }

    public get layout() {
        return this._layout;
    }
}
