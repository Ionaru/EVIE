import { Param } from './endpoint.param';

export class Endpoint {
  directory: string;
  name: string;
  params: Array<Param>;
  url: string;

  constructor(directory: string, name: string, params: Array<Param>) {
    this.directory = directory;
    this.name = name;
    this.params = params;
  }
}
