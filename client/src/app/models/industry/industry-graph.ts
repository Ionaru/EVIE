import { Edge, Node } from '@swimlane/ngx-graph';

export class IndustryGraph {
    public links: Edge[] = [];
    public nodes: Node[] = [];

    addLink(fromNode: number | string, toNode: number | string, amount: number) {
        let link = this.links.find((l) => l.source === fromNode.toString() && l.target === toNode.toString());
        if (!link) {
            link = {
                source: fromNode.toString(),
                target: toNode.toString(),
                label: '0',
            };
            this.links.push(link);
        }

        link.label = (Number(link.label) + amount).toString();
    }

    public addNode(id: number | string, name: string, amount: number) {
        const nodeId = id.toString();
        let node = this.nodes.find((n) => n.id === nodeId);
        if (!node) {
            node = {id: nodeId, label: nodeId.toString(), data: {}};
            this.nodes.push(node);
        }
        node.label = name;
        node.data.amount = ((node.data.amount || 0) + amount);
    }
}
