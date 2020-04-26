import { IndustryNode } from './industry-node';

export class ShoppingList {
    public readonly list: IndustryNode[] = [];

    public add(nodeToAdd: IndustryNode) {
        const existingNode = this.list.find((node) => node.product.type_id === nodeToAdd.product.type_id);
        if (existingNode) {
            existingNode.quantity += nodeToAdd.quantity;
            existingNode.price += nodeToAdd.price;
        } else {
            this.list.push(nodeToAdd);
        }
    }
}
