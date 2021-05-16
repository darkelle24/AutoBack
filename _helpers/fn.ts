import { DataTypes, Op } from "sequelize"
import { DataType, dataType, dataTypeInfo, realDataType, realDataTypeInfo, saveDataTableInfo, saveTable } from "./models/models"
import { FilterInfoType, FilterOperators, ListFilter, RealFilterInfo } from "./models/routeModels"
import * as _ from "lodash"
import validator from "validator"

export function defaultJsonToDB(data: any): any {
  return data
}

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
  if (path2[0] === '/')
    return path1 + path2
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
  let basic: dataType = {
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
      }
    },
    text: {
      sequelizeType: DataTypes.TEXT,
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
      }
    },
    string: {
      sequelizeType: DataTypes.STRING,
      validate: {
      }
    }
  }

  return basic
}

export function addType(oldTypes: realDataType, newTypes: realDataType): realDataType {
  return _.merge(oldTypes, newTypes)
}

export function applyDefaultValueOnDataType(basic: dataType): realDataType {
  let toReturn: realDataType = {}

  Object.entries(basic).forEach(([key, value]) => {
    if ((<any>Object).values(DataType).includes(key)) {
      let temp: any = _.merge({}, value)

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
  let toReturn: FilterInfoType[] = []

  if (list.length !== 0) {
    list.forEach((value) => {
      let type = filterOperatorToSequelizeOperator(value)
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
  let toReturn: ListFilter = {}

  Object.entries(table).forEach(([key, value]) => {
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