import { TableClass } from "back/table"
import { ModelValidatior } from "./models"
import { ABDataType, realDataTypeInfo } from "./modelsType"

export interface Table {
  [key: string]: dataTableInfo | dataLinkTable
}

export type dataLinkTable = {
  tableToLink: TableClass<any>,
  columnsLink: string,
  type: ABDataType.TABLE_LINK | ABDataType.MULTIPLE_LINK_TABLE ,
  onDelete?: DeleteAction,
  rename?: string,
  multipleResult?: boolean
} & dataTableInfo

export interface dataTableInfo {
  type: ABDataType,
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
  transformGet?(value: any, table: TableClass<any>): any,
  validate?: ModelValidatior
}

export interface saveTable {
  [key: string]: saveDataTableInfo | realDataLinkTable
}

export interface tempSaveTable {
  saveTable: saveTable,
  table?: TableClass<any>
}

export enum DeleteAction {
  DELETE = "delete",
  SET_DEFAULT = "default",
  SET_NULL = "null",
}

export type realDataLinkTable = {
  tableToLink: TableClass<any>,
  columnsLink: string,
  onDelete: DeleteAction,
  rename?: string,
  multipleResult: boolean,
  subType: ABDataType.TABLE_LINK | ABDataType.MULTIPLE_LINK_TABLE
} & saveDataTableInfo

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
  transformGet?(value: any, table: TableClass<any>): any,
  validate?: ModelValidatior
}

export interface allTables {
  [key: string]: TableClass<any>
}

export interface TableLinktoThisTable {
  table: TableClass<any>,
  columns: string
}