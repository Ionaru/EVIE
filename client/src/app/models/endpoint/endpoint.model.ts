import { Param } from './endpoint.param';

export class Endpoint {
    public directory: string;
    public name: string;
    public params: Param[];
    public url: string;

    constructor(directory: string, name: string, params: Param[]) {
        this.directory = directory;
        this.name = name;
        this.params = params;
    }
}
