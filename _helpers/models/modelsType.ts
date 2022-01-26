import { DataTypeAbstract } from "sequelize"
import { ModelValidator } from "./models"
import { FilterInfoType } from "./routeModels"

export type dataType = {
  [key: string]: dataTypeInfo
}

export interface dataTypeInfo {
  sequelizeType: DataTypeAbstract,
  autobackDataType?: ABDataType,
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
  validate?: ModelValidator
}

export type realDataType = {
  [key: string]: realDataTypeInfo
}

export interface realDataTypeInfo {
  name: string,
  sequelizeType: DataTypeAbstract,
  autobackDataType: ABDataType,
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
  validate: ModelValidator,
  isTableLink: boolean,
  isFile: boolean
}

export enum ABDataType {
  DATE = "date",
  INT = "int",
  TEXT = "text",
  ARRAY = "array",
  FLOAT = "float",
  BOOLEAN = "boolean",
  BIGINT = "bigInt",
  STRING = "string",
  FILE = "file",
  TABLE_LINK = "tableLink",
  MULTIPLE_LINK_TABLE= "multipleTableLink"
}