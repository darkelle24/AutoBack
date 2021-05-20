import { realDataType } from "./modelsType";

export enum DB {
  POSTGRES
}

export interface DBInterface {
  readonly dbName: string,
  dataType: realDataType;
  addTypes(newTypes: realDataType): void
}