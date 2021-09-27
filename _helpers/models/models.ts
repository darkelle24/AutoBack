import { TableClass } from 'back/table';
import { DB } from 'index';
import multer from "multer"

export interface routeTableInfo {
  classTable: TableClass<any>
  uploads?: multer.Multer,
  pathFolder?: string
}

export interface filePathInfo {
  folderPath: string,
  virtualPath?: string
}

export interface ModelValidator {
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

export interface AutoBackConstructorParameters {
  connnectionStr: string,
  db?: DB,
  activeHealthRoute?: boolean,
  fileInfo?: filePathInfo,
  serverPath?: string,
  activeLog?: boolean,
  resetDb?: boolean,
  debug?: boolean,
  name?: string
}
