// @ts-ignore
import * as PlotlyJS from 'plotly.js';

interface ISankeyDiagramSetup {
    orientation: 'h' | 'v';
}

export class SankeyDiagram {

    private readonly _layout: Partial<PlotlyJS.Layout>;
    private readonly _data: any;

    constructor(layout: Partial<PlotlyJS.Layout>, data: ISankeyDiagramSetup) {
        this._layout = {
            font: {
                color: 'white',
                size: 10,
            },
            ...layout,
        };
        this._data = {
            link: {
                color: [],
                source: [],
                target: [],
                value: [],
            },
            node: {
                label: [],
                // color: [],
                pad: 15,
                thickness: 30,
            },
            orientation: 'h',
            type: 'sankey',
            valuesuffix: ' ISK',
            ...data,
        };
    }

    public get layout() {
        return this._layout;
    }

    public get data() {
        return this._data;
    }

    /**
     * Add a link from one Node to another with a desired strength, new Nodes will be created if they do not exist.
     */
    public addLink(source: string, target: string, strength: number) {
        const sourceIndex = this.getLinkIndex(source);
        const targetIndex = this.getLinkIndex(target);

        this._data.link.source.push(sourceIndex);
        this._data.link.target.push(targetIndex);
        this._data.link.value.push(strength);
        this._data.link.color.push('#C2C4C5');
    }

    /**
     * This will get or create a Node and return its index in the diagram data.
     */
    private getLinkIndex(linkName: string): number {
        const label = this._data.node.label;
        return !label.includes(linkName) ? (label.push(linkName) - 1) : label.indexOf(linkName);
    }
}
