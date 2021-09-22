import { DataType, DataTypes, ModelCtor, Op } from "sequelize"
import { FilterInfoType, FilterOperators, InfoPlace, ListFilter, TypeRoute } from "./models/routeModels"
import * as _ from "lodash"
import validator from "validator"
import path from "path"
import fs from 'fs'
import { ABDataType, dataType, realDataType, realDataTypeInfo } from "./models/modelsType"
import { saveTable } from "./models/modelsTable"
import express from "express"
import { AutoBack } from "../back/autoBack"
import { AutoBackConstructorParameters } from "./models/models"

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function defaultJsonToDB(data: any): any {
  return data
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function defaultDBToJson(data: any): any {
  return data
}

export function defaultSaveDataInfo(): any {
  return ({
    primaryKey: false,
    autoIncrement: false,
    comment: null,
    allowNull: false,
    keepOldValue: true,
    initValue: null,
    unique: false
  })
}

export function addPath(path1: string, path2: string): string {
  const lastOne = path1[path1.length -1]

  if ((path2[0] === '/' && lastOne !== '/') || (path2[0] !== '/' && lastOne === '/'))
    return path1 + path2
  if (path2[0] === '/' && lastOne === '/')
    return path1 + path2.substring(1)
  return path1 + '/' + path2
}

function dateToNumber(data: string | number | Date): number {
  let date: Date

  if (typeof data === 'string' || typeof data === 'number')
    date = new Date(data)
  else
    date = data
  return date.getTime()
}

export function basicDataType(): dataType {
  const basic: dataType = {
    date: {
      sequelizeType: DataTypes.BIGINT,
      JsonToDB: dateToNumber,
      DBToJson: (data: any): any => { return data ? new Date(data) : null },
      filterOperator: {
        inverse: false,
        list: getNumberOperatorFilter(),
        transform: dateToNumber
      },
      validate: {
        isDate: true
      }
    },
    int: {
      sequelizeType: DataTypes.INTEGER,
      filterOperator: {
        inverse: false,
        list: getNumberOperatorFilter()
      },
      validate: {
        isInt: true
      },
      JsonToDB: (data: any): any => {
        return Number(data)
      }
    },
    text: {
      sequelizeType: DataTypes.TEXT,
      JsonToDB: (data: any): any => {
        return data.toString()
      }
    },
    array: {
      sequelizeType: DataTypes.TEXT,
      JsonToDB: (data: any[]): any => { return JSON.stringify(data) },
      DBToJson: (data: any): any[] => { return JSON.parse(data) },
      validate: {
        isArray: true
      }
    },
    float: {
      sequelizeType: DataTypes.FLOAT,
      filterOperator: {
        inverse: false,
        list: getNumberOperatorFilter()
      },
      validate: {
        isFloat: true
      },
      JsonToDB: (data: any): any => {
        return Number(data)
      }
    },
    boolean: {
      sequelizeType: DataTypes.BOOLEAN,
      validate: {
        isBoolean: true
      },
      JsonToDB: (data: any): any => {
        if (typeof data === 'string')
          return validator.toBoolean(data, true)
        return Boolean(data)
      },
    },
    bigInt: {
      sequelizeType: DataTypes.BIGINT,
      filterOperator: {
        inverse: false,
        list: getNumberOperatorFilter()
      },
      validate: {
        isInt: true
      },
      JsonToDB: (data: any): any => {
        return Number(data)
      }
    },
    string: {
      sequelizeType: DataTypes.STRING,
      JsonToDB: (data: any): any => {
        return data.toString()
      }
    },
    file: {
      sequelizeType: DataTypes.STRING,
      JsonToDB: (data: any): any => {
        return data.toString()
      }
    }
  }

  return basic
}

export function addType(oldTypes: realDataType, newTypes: realDataType): realDataType {
  return _.merge(oldTypes, newTypes)
}

export function applyDefaultValueOnDataType(basic: dataType): realDataType {
  const toReturn: realDataType = {}

  Object.entries(basic).forEach(([key, value]) => {
    if ((<any>Object).values(ABDataType).includes(key)) {
      const temp: any = _.merge({}, value)

      temp.name = key
      temp.autobackDataType = <DataType> key
      if (temp.filterOperator === undefined) {
        temp.filterOperator = {
          inverse: false,
          list: getStringToOperatorFilterList(getBasicOperatorFilter())
        }
      } else {
        if (temp.filterOperator.inverse === undefined)
          temp.filterOperator.inverse = false
        if (temp.filterOperator.list && temp.filterOperator.list.lenght !== 0) {
          temp.filterOperator.list = getStringToOperatorFilterList(temp.filterOperator.list)
        }
      }
      if (!value.validate)
        temp.validate = {}
      temp.isTableLink = false
      toReturn[key] = temp
    }
  })
  return toReturn
}

export function filterOperatorToSequelizeOperator(filterOperatorName: string): FilterInfoType | undefined {
  switch (filterOperatorName) {
    case ('equal'): {
      return {
        name: 'equal',
        reduce_name: 'eq',
        sequilize_type: Op.eq
      }
    }
    case ('negatif'): {
      return {
        name: 'negatif',
        reduce_name: 'ne',
        sequilize_type: Op.ne
      }
    }
    case ('is'): {
      return {
        name: 'is',
        reduce_name: 'is',
        sequilize_type: Op.is
      }
    }
    case ('not'): {
      return {
        name: 'not',
        reduce_name: 'not',
        sequilize_type: Op.not
      }
    }
    case ('greater_than'): {
      return {
        name: 'greater_than',
        reduce_name: 'gt',
        sequilize_type: Op.gt
      }
    }
    case ('greater_than_equals'): {
      return {
        name: 'greater_than_equals',
        reduce_name: 'gte',
        sequilize_type: Op.gte
      }
    }
    case ('smaller_than'): {
      return {
        name: 'smaller_than',
        reduce_name: 'lt',
        sequilize_type: Op.lt
      }
    }
    case ('smaller_than_equals'): {
      return {
        name: 'smaller_than_equals',
        reduce_name: 'lte',
        sequilize_type: Op.lte
      }
    }
    case ('substring'): {
      return {
        name: 'substring',
        reduce_name: 'substr',
        sequilize_type: Op.substring
      }
    }
    case ('regexp'): {
      return {
        name: 'regexp',
        reduce_name: 'reg',
        sequilize_type: Op.regexp
      }
    }
    default: {
      return undefined
    }
  }
}

export function getBasicOperatorFilter(): string[] {
  return ["equal", "negatif", "is", "not"]
}

export function getNumberOperatorFilter(): string[] {
  return getBasicOperatorFilter().concat(["greater_than", "greater_than_equals", "smaller_than", "smaller_than_equals"])
}

export function getStringToOperatorFilterList(list: string[]): FilterInfoType[] {
  const toReturn: FilterInfoType[] = []

  if (list.length !== 0) {
    list.forEach((value) => {
      const type = filterOperatorToSequelizeOperator(value)
      if (type !== undefined && !toReturn.find((element) => {
        if (type && element.name === type.name)
          return true
        return false
      })) {
        toReturn.push(type)
      }
    })
  }
  return toReturn
}

export function autorizeFilterOperator(type: FilterInfoType, info: realDataTypeInfo): boolean {
  let toReturn: boolean = false

  if (info.filterOperator.list === undefined)
    toReturn = true
  else if (info.filterOperator.list === null)
    toReturn = false
  else if (Object.values(info.filterOperator.list).find((element: any) => {
    return (type.name === element.name && type.reduce_name === element.reduce_name)
  })) {
    toReturn = true
  }

  if (info.filterOperator.inverse)
    toReturn = !toReturn
  return toReturn
}

export function activeAllFiltersForAllCols(table: saveTable): ListFilter {
  const toReturn: ListFilter = {}

  Object.entries(table).forEach(([key]) => {
    toReturn[key] = allFilter()
  })
  return toReturn
}

export function allFilter(): FilterOperators {
  return {
    equal: {},
    negatif: {},
    is: {},
    not: {},
    greater_than: {},
    greater_than_equals: {},
    smaller_than: {},
    smaller_than_equals: {},
    substring: {},
    regexp: {},
  }
}

export function getFileExtansion(filename: string): string | undefined {
  const toReturn = path.extname(filename)

  if (toReturn === '')
    return undefined
  return toReturn
}
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function errorHandling(err: any, res: express.Response): express.Response {
  if (err.errors !== undefined) {
    res.status(400).json({ message: err.name + ': ' + err.errors[0].message })
    res.statusMessage = err.name + ': ' + err.errors[0].message
    return res
  }
  res.status(400).json({ message: err.toString() })
  res.statusMessage = err.toString()
  return res
}

export function removeFile(path: string): void {
  fs.access(path, (err) => {
    if (err) {
      return
    }
    fs.unlink(path, (err) => {
      if (err) {
        console.error(err)
        return
      }
    })
  })
}
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function getRowInTableLink(columnsNameOfLinkTable: string, sequelizeOfLinkTable: ModelCtor<any>, value: any, multipleResult: boolean = false): Promise<any | undefined> {
  const filter: any = {}
  filter.where = {}
  filter.where[columnsNameOfLinkTable] = value
  let result

  if (!multipleResult)
    result = await sequelizeOfLinkTable.findOne(filter)
  else
    result = await sequelizeOfLinkTable.findAll(filter)
  return result
}

export async function getRowInTableMultipleLink(columnsNameOfLinkTable: string, sequelizeOfLinkTable: ModelCtor<any>, value: any[], multipleResult: boolean = false): Promise<any | undefined> {
  return await Promise.all(value.map(async (element: any) => {
    return getRowInTableLink(columnsNameOfLinkTable, sequelizeOfLinkTable, element, multipleResult)
  }))
}

export function checkHasTableLink(table: saveTable): boolean {
  return Object.values(table).some((values) => {
    if (values.type.isTableLink)
      return true
  })
}

export function formatDate(d: Date): string {
  let month = '' + (d.getMonth() + 1).toString()
  let day = '' + d.getDate().toString()
  const year = d.getFullYear().toString()
  let hour = d.getHours().toString()

  if (month.length < 2)
    month = '0' + month;
  if (day.length < 2)
    day = '0' + day;
  if (hour.length < 2)
    hour = '0' + hour;

  return [year, month, day, hour].join('-');
}

export function infoPlaceToString(place: InfoPlace): string {
  if (place === InfoPlace.BODY) {
    return "Body"
  } else if (place === InfoPlace.HEADER) {
    return "Header"
  } else if (place === InfoPlace.QUERYPARAMS) {
    return "Querry parameters"
  } else if (place === InfoPlace.PARAMS) {
    return "Parameters"
  } else {
    return "Undefined"
  }
}

export function typeRouteToString(type: TypeRoute): string {
  if (type === TypeRoute.GET) {
    return "GET"
  } else if (type === TypeRoute.POST) {
    return "POST"
  } else if (type === TypeRoute.PUT) {
    return "PUT"
  } else if (type === TypeRoute.DELETE) {
    return "DELETE"
  } else {
    return "Undefined"
  }
}
export function createAutoBack(infoAutoBack: AutoBackConstructorParameters): AutoBack {
  return new AutoBack(infoAutoBack.connnectionStr, infoAutoBack.db, infoAutoBack.activeHealthRoute, infoAutoBack.fileInfo, infoAutoBack.serverPath, infoAutoBack.activeLog, infoAutoBack.resetDb, infoAutoBack.debug)
}

export function writeInFile(path: string, text: string) {
  fs.writeFile(path, text, (err) => {
    // throws an error, you could also catch it here
    if (err) throw err;
  });
}