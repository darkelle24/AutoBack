import multer from "multer"
import { DataTypeAbstract, ModelValidateOptions } from "sequelize"
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
  },
  validate?: ModelValidatior
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
  },
  validate: ModelValidatior
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
  FILE = "file"
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
  transformGet?(value: any, table: TableClass<any>): any,
  validate?: ModelValidatior
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
  transformGet?(value: any, table: TableClass<any>): any,
  validate?: ModelValidatior
}

export interface allTables {
  [key: string]: TableClass<any>
}

export interface routeTableInfo {
  table: saveTable,
  uploads?: multer.Multer,
  pathFolder?: string
}

export interface filePathInfo {
  folderPath: string,
  virtualPath?: string
}

export interface ModelValidatior {
  contains?: {
    seed: string,
    msg?: string
  },

  equals?: {
    comparaison: any,
    msg?: string
  },

  isAlpha?: {
    msg?: string
  } | boolean,

  isAlphanumeric?: {
    msg?: string
  } | boolean,

  isBoolean?: {
    msg?: string
  } | boolean,

  isDataURI?: {
    msg?: string
  } | boolean,

  isEmail?: {
    msg?: string
  } | boolean,

  isEmpty?: {
    ignore_whitespace?: boolean,
    msg?: string
  } | boolean,

  isFloat?: {
    gte?: number,
    gt?: number,
    lt?: number,
    lte?: number,
    msg?: string
  } | boolean,

  isIn?: {
    values: any,
    msg?: string
  },

  isInt?: {
    gte?: number,
    gt?: number,
    lt?: number,
    lte?: number,
    msg?: string
  } | boolean,

  isJSON?: {
    msg?: string
  } | boolean,

  isLength?: {
    min?: number,
    max?: number,
    msg?: string
  } | boolean,

  isLowercase?: {
    msg?: string
  } | boolean,

  isNumeric?: {
    no_symbols?: boolean,
    msg?: string
  } | boolean,

  isUppercase?: {
    msg?: string
  } | boolean,

  isStrongPassword?: {
    minLength?: number,
    minLowercase?: number,
    minUppercase?: number,
    minNumbers?: number,
    minSymbols?: number,
    maxLength?: number,
    msg?: string
  } | boolean,

  isURL?: {
    protocols?: string[],
    require_protocol?: boolean,
    require_valid_protocol?: boolean,
    require_host?: boolean,
    allow_protocol_relative_urls?: boolean,
    msg?: string
  } | boolean,

  isWhitelisted?: {
    char: string[],
    msg?: string
  },

  isBlacklisted?: {
    char: string[],
    msg?: string
  },

  isArray?: {
    msg?: string
  } | boolean,

  isRegex?: {
    regex: string,
    msg?: string
  }

  isDate?: {
    msg?: string
  } | boolean,
}
