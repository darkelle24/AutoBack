import { TableClass } from "back/table"
import { ModelValidator } from "./models"
import { ABDataType, realDataTypeInfo } from "./modelsType"

export interface Table {
  [key: string]: dataTableInfo | dataLinkTable | dataFileTable
}

export type dataLinkTable = {
  tableToLink: string,
  columnsLink: string,
  type: ABDataType.TABLE_LINK | ABDataType.MULTIPLE_LINK_TABLE ,
  onDelete?: DeleteAction,
  rename?: string,
  multipleResult?: boolean,
  transformGetLinkedData?(value: any): void
} & dataTableInfo

export type dataFileTable = {
  type: ABDataType.FILE,
  maxFileSize?: number,
  extAuthorize?: string[]
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
  neverShow?: boolean,
  keepOldValue?: boolean,
  /**
     * Execute before execute dataTypeInfo.JsonToDB and after validate
  */
  transformSet?(value: any, table: TableClass<any>): any
  /**
     * Execute after execute dataTypeInfo.DBToJson
  */
  transformGet?(value: any, table: TableClass<any>): any,
  validate?: ModelValidator
}

export interface saveTable {
  [key: string]: saveDataTableInfo | realDataLinkTable | realDataFileTable
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
  subType: ABDataType.TABLE_LINK | ABDataType.MULTIPLE_LINK_TABLE,
  transformGetLinkedData?(value: any): void,
} & saveDataTableInfo

export type realDataFileTable = {
  maxFileSize?: number,
  extAuthorize?: string[]
} & realDataLinkTable

export interface saveDataTableInfo {
  type: realDataTypeInfo,
  primaryKey: boolean,
  autoIncrement: boolean,
  comment: string | null,
  allowNull: boolean,
  initValue: any | null,
  defaultValue?: any,
  unique: boolean,
  neverShow: boolean,
  keepOldValue: boolean,
  /**
     * Execute before execute dataTypeInfo.JsonToDB and after validate
  */
   transformSet?(value: any, table: TableClass<any>): any
   /**
      * Execute after execute dataTypeInfo.DBToJson
   */
  transformGet?(value: any, table: TableClass<any>): any,
  validate?: ModelValidator
}

export interface allTables {
  [key: string]: TableClass<any>
}

export interface TableLinktoThisTable {
  table: TableClass<any>,
  columns: string
}