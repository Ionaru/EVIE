import { IUniverseTypeData } from '@ionaru/eve-utils';

import { AcquireMethod } from './acquire-method';

export class IndustryNode {
    public price = Infinity;
    public acquireMethod?: AcquireMethod;
    public totalIndustryCost = 0;
    public materialPrice = Infinity;
    public children: IndustryNode[] = [];


    constructor(
        public product: IUniverseTypeData,
        public quantity: number,
    ) { }
}
