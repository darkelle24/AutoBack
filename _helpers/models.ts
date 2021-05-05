import { DataTypeAbstract } from "sequelize"
import { TableClass } from "./class"

export type dataType = {
  [key: string]: dataTypeInfo
}

export interface dataTypeInfo {
  sequelizeType: DataTypeAbstract,
  autobackDataType?: DataType,
  JsonToDB?(data: any): any,
  DBToJson?(data: any): any
}

export enum DB {
  POSTGRES
}

export interface DBInterface {
  readonly dbName: string,
  readonly dataType: dataType;
}

export enum DataType {
  DATE = "date",
  INT = "int",
  TEXT = "text",
  ARRAY = "array",
  FLOAT = "float",
  BOOLEAN = "boolean",
  BIGINT = "bigInt",
  STRING = "string",
}

export interface Table {
  [key: string]: dataTableInfo
}

export interface dataTableInfo {
  type: DataType,
  primaryKey?: boolean,
  autoIncrement?: boolean,
  comment?: string,
  allowNull?: allowNullParams | boolean,
}

export interface allowNullParams {
  keepOldValue?: boolean
}

export interface saveTable {
  [key: string]: saveDataTableInfo
}

export interface saveDataTableInfo {
  type: dataTypeInfo,
  primaryKey?: boolean,
  autoIncrement?: boolean,
  comment?: string,
  allowNull?: allowNullParams
}

export interface allTables {
  [key: string]: TableClass<any>
}
