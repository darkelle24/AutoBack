import { DataTypes } from "sequelize"
import { saveDataTableInfo } from "./models/models"

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
      DBToJson: (data: any): any => { return new Date(data) },
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

