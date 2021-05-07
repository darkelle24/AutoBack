import { DataTypes, Op } from "sequelize"
import { saveDataTableInfo } from "./models/models"
import { FilterInfoType, RealFilterInfo } from "./models/routeModels"

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
    allowNull: {
      keepOldValue: false
    },
    initValue: null,
  })
}

export function addPath(path1: string, path2: string): string {
  if (path2[0] === '/')
    return path1 + path2
  return path1 + '/' + path2
}

export function basicDataType() {
  return {
    date: {
      sequelizeType: DataTypes.STRING,
      JsonToDB: (data: string | number | Date): any => {
        let date: Date

        if (typeof data === 'string' || typeof data === 'number')
          date = new Date(data)
        else
          date = data
        return date.toJSON()
      },
      DBToJson: (data: any): any => { return data ? new Date(data) : null },
    },
    int: {
      sequelizeType: DataTypes.INTEGER,
    },
    text: {
      sequelizeType: DataTypes.TEXT,
    },
    array: {
      sequelizeType: DataTypes.TEXT,
      JsonToDB: (data: any[]): any => { return JSON.stringify(data) },
      DBToJson: (data: any): any[] => { return JSON.parse(data) },
    },
    float: {
      sequelizeType: DataTypes.FLOAT,
    },
    boolean: {
      sequelizeType: DataTypes.BOOLEAN,
    },
    bigInt: {
      sequelizeType: DataTypes.BIGINT,
    },
    string: {
      sequelizeType: DataTypes.STRING,
    }
  }
}

export function filterOperatorToSequelizeOperator(filterOperatorName: string): FilterInfoType | undefined {
  switch (filterOperatorName) {
    case ('equal'): {
      return {
        name: 'equal',
        reduce_name: 'eq',
        sequilize_type: [Op.eq]
      }
    }
    case ('negatif'): {
      return {
        name: 'negatif',
        reduce_name: 'ne',
        sequilize_type: [Op.ne]
      }
    }
    case ('is'): {
      return {
        name: 'is',
        reduce_name: 'is',
        sequilize_type: [Op.is]
      }
    }
    case ('not'): {
      return {
        name: 'not',
        reduce_name: 'not',
        sequilize_type: [Op.not]
      }
    }
    case ('greater_than'): {
      return {
        name: 'greater_than',
        reduce_name: 'gt',
        sequilize_type: [Op.gt]
      }
    }
    case ('greater_than_equals'): {
      return {
        name: 'greater_than_equals',
        reduce_name: 'gte',
        sequilize_type: [Op.gte]
      }
    }
    case ('smaller_than'): {
      return {
        name: 'smaller_than',
        reduce_name: 'lt',
        sequilize_type: [Op.lt]
      }
    }
    case ('smaller_than_equals'): {
      return {
        name: 'smaller_than_equals',
        reduce_name: 'lte',
        sequilize_type: [Op.lte]
      }
    }
    case ('substring'): {
      return {
        name: 'substring',
        reduce_name: 'substr',
        sequilize_type: [Op.substring]
      }
    }
    case ('regexp'): {
      return {
        name: 'regexp',
        reduce_name: 'reg',
        sequilize_type: [Op.regexp]
      }
    }
    default: {
      return undefined
    }
  }
}

