import { StatusCodes } from "http-status-codes"
import { Model, ModelCtor } from "sequelize/types"
import { filterOperatorToSequelizeOperator } from "../../_helpers/fn"
import { saveDataTableInfo, saveTable } from "../../_helpers/models/models"
import { acceptData, ListFilter, FilterInfo, InfoPlace } from "../../_helpers/models/routeModels"

export class RouteBasicClass<M extends Model> {

  readonly path: string
  sequelizeData: ModelCtor<M>
  table: saveTable
  protected server: any

  constructor(table: saveTable, sequelizeData: ModelCtor<M>, server: any, path: string) {
    this.sequelizeData = sequelizeData
    this.table = table
    this.server = server
    this.path = path
  }


  protected setValue(value: any, info: saveDataTableInfo, created: boolean = true, olderValue?: any): any {
    let toReturn: any

    if (value !== undefined && value !== null) {
      toReturn = value
      if (info.type.JsonToDB)
        toReturn = info.type.JsonToDB(toReturn)
    } else if (created === false && olderValue !== undefined && olderValue !== null && info.allowNull.keepOldValue) {
      toReturn = olderValue
    } else if (info.defaultValue !== undefined) {
      toReturn = info.defaultValue
      if (info.type.JsonToDB)
        toReturn = info.type.JsonToDB(toReturn)
    } else {
      toReturn = null
    }
    return toReturn
  }

  protected getValue(value: any, info: saveDataTableInfo): any {
    if (info.type.DBToJson) {
      return info.type.DBToJson(value)
    }
    return value
  }

  protected getAllValue(data: any) {
    Object.entries(this.table).forEach(([key, value]) => {
      data[key] = this.getValue(data[key], value)
    })
  }

  protected list(data: any, accept: acceptData): any {
    if (accept.inverse)
      return this.blackList(data, accept)
    return this.whiteList(data, accept)
  }

  protected blackList(data: any, accept: acceptData): any {
    if (accept.whitelist && accept.whitelist.length !== 0) {
      let toReturn: any = data
      let list: string[] = accept.whitelist

      Object.entries(data).forEach(([key, value]) => {
        if (list.find(element => element === key))
          delete toReturn[key]
      })
      return toReturn
    } else if (accept.whitelist !== undefined && (accept.whitelist === null || accept.whitelist.length === 0)) {
      return data
    } else if (accept.whitelist === undefined) {
      return {}
    }
  }

  protected whiteList(data: any, accept: acceptData): any {
    if (accept.whitelist && accept.whitelist.length !== 0) {
      let toReturn: any = {}
      let list: string[] = accept.whitelist

      Object.entries(data).forEach(([key, value]) => {
        if (list.find(element => element === key))
          toReturn[key] = value
      })
      return toReturn
    } else if (accept.whitelist !== undefined && (accept.whitelist === null || accept.whitelist.length === 0)) {
      return {}
    } else if (accept.whitelist === undefined) {
      return data
    }
  }

  protected getFilterInfoForSequilizeFind(req: any, filters?: ListFilter): any | undefined {
    if (filters) {
      let toReturn: any = {}

      Object.entries(filters).forEach(([keyCol, valueCol]) => {
        if (this.table.hasOwnProperty(keyCol)) {
          toReturn[keyCol] = {}
          Object.entries(valueCol).forEach(([key, value]) => {
            let type = filterOperatorToSequelizeOperator(key)
            if (type !== undefined) {
              //toReturn[keyCol][type] = {}
            }
          })
        }
      })
    } else {
      return undefined
    }
  }

  protected getValueFrom(req: any, info: FilterInfo): any | undefined {
    if (info.where === InfoPlace.BODY) {
      //return req.body[info.name]
    }
  }
}