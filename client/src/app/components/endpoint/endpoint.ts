import { Param } from './endpoint.param';

export class Endpoint {
  accessMask: number;
  directory: string;
  type: string;
  name: string;
  groupID: number;
  description: string;
  params: Array<Param>;
  url: string;

  constructor(directory: string, name: string, params: Array<Param>) {
    this.directory = directory;
    this.name = name;
    this.params = params;
  }

  fillData(accessMask: number, type: string, groupID: number, description: string) {
    this.accessMask = accessMask;
    this.type = type;
    this.groupID = groupID;
    this.description = description;
  }
}
