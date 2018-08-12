interface IEVEDataCache {
    [index: string]: any;
}

export class CacheController {

    public static eveDataCache: IEVEDataCache = {};
}
