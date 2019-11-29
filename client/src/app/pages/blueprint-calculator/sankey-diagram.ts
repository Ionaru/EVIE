// @ts-ignore
import * as PlotlyJS from 'plotly.js';

// interface ISankeyDiagramNode {
//     node: {
//         pad?: number;
//         thickness?: number;
//         line?: {
//             color?: string;
//             width?: number;
//         };
//         label: string[];
//         color?: string[];
//     };
// }

interface ISankeyDiagramSetup {
    orientation: 'h' | 'w';
}
//
// interface ISankeyDiagramData extends ISankeyDiagramSetup {
//     link: {
//         source: number[];
//         target: number[];
//         value: number[];
//         color?: number[];
//     };
// }

export class SankeyDiagram {

    private readonly _layout: Partial<PlotlyJS.Layout>;
    private readonly _data: any;

    constructor(layout: Partial<PlotlyJS.Layout>, data: ISankeyDiagramSetup) {
        this._layout = layout;
        this._data = {
            link: {
                // color: [],
                source: [],
                target: [],
                value: [],
            },
            node: {
                // color: [],
                label: [],
            },
            orientation: 'h',
            type: 'sankey',
            ...data,
        };
    }

    public get layout() {
        return this._layout;
    }

    public get data() {
        return this._data;
    }

    public addLink(source: string, target: string, value: number, color = '#EFF0F1') {
        let sourceIndex: number;
        let targetIndex: number;

        if (!this._data.node.label.includes(source)) {
            sourceIndex = this._data.node.label.push(source) - 1;
            // this._data.node.color.push(color);
        } else {
            sourceIndex = this._data.node.label.indexOf(source);
        }

        if (!this._data.node.label.includes(target)) {
            targetIndex = this._data.node.label.push(target) - 1;
            // this._data.node.color.push(color);
        } else {
            targetIndex = this._data.node.label.indexOf(target);
        }

        console.log(sourceIndex, targetIndex, value, color);

        this._data.link.source.push(sourceIndex);
        this._data.link.target.push(targetIndex);
        this._data.link.value.push(value);
        // this._data.link.color.push(color);
        console.log(this._data);
    }

    // public addNode(label: string, color?: string){}
}
