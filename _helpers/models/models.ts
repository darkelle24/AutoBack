import { DataTypeAbstract } from "sequelize"
import { TableClass } from "../../back/table"
import { FilterInfoType } from "./routeModels"

export type dataType = {
  [key: string]: dataTypeInfo
}

export interface dataTypeInfo {
  sequelizeType: DataTypeAbstract,
  autobackDataType?: DataType,
  JsonToDB?(data: any): any,
  DBToJson?(data: any): any,
  /**
    * If filterOperator undefined accept all basic operator
  */
  filterOperator?: {
    /**
    * If list undefined accept all operator
    *
    * If list null accept no operator
    */
    list?: string[] | null,
    /**
    * If inverse is true list became blacklist
    */
    inverse?: boolean,
    /**
    * Replace transform from FilterInfo if FilterInfo.transform === undefined
    */
    transform?(data: any): any
  }
}

export type realDataType = {
  [key: string]: realDataTypeInfo
}

export interface realDataTypeInfo {
  name: string,
  sequelizeType: DataTypeAbstract,
  autobackDataType: DataType,
  JsonToDB?(data: any): any,
  DBToJson?(data: any): any,
  /**
    * If filterOperator undefined accept all basic operator
  */
  filterOperator: {
    /**
    * If list undefined accept all operator
    *
    * If list null accept no operator
    */
    list?: FilterInfoType[] | null,
    /**
    * If inverse is true list became blacklist
    */
    inverse: boolean,
    /**
    * Replace transform from FilterInfo if FilterInfo.transform === undefined
    */
    transform?(data: any): any
  }
}

export enum DB {
  POSTGRES
}

export interface DBInterface {
  readonly dbName: string,
  dataType: realDataType;
  addTypes(newTypes: realDataType): void
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
  allowNull?: boolean,
  initValue?: any,
  defaultValue?: any,
  unique?: boolean,
  keepOldValue?: boolean,
  /**
     * Execute before execute dataTypeInfo.JsonToDB and after validate
  */
  transformSet?(value: any, table: TableClass<any>): any
  /**
     * Execute after execute dataTypeInfo.DBToJson
  */
  transformGet?(value: any, table: TableClass<any>): any
}

export interface saveTable {
  [key: string]: saveDataTableInfo
}

export interface tempSaveTable {
  saveTable: saveTable,
  table?: TableClass<any>
}

export interface saveDataTableInfo {
  type: realDataTypeInfo,
  primaryKey: boolean,
  autoIncrement: boolean,
  comment: string | null,
  allowNull: boolean,
  initValue: any | null,
  defaultValue?: any,
  unique: boolean,
  keepOldValue: boolean,
  /**
     * Execute before execute dataTypeInfo.JsonToDB and after validate
  */
   transformSet?(value: any, table: TableClass<any>): any
   /**
      * Execute after execute dataTypeInfo.DBToJson
   */
  transformGet?(value: any, table: TableClass<any>): any
}

export interface allTables {
  [key: string]: TableClass<any>
}
