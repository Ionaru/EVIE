import { DagreLayout, DagreSettings, Orientation } from '@swimlane/ngx-graph';

export class IndustryGraphLayout extends DagreLayout {
    settings: DagreSettings = {
        orientation: Orientation.TOP_TO_BOTTOM,
        ranker: 'network-simplex',
        rankPadding: 300,
    };
}
