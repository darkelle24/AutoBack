import { RealFilterInfo, RealListFilter } from './../../_helpers/models/routeModels';
import { StatusCodes } from "http-status-codes"
import { Model, ModelCtor } from "sequelize/types"
import { autorizeFilterOperator, filterOperatorToSequelizeOperator } from "../../_helpers/fn"
import { saveDataTableInfo, saveTable } from "../../_helpers/models/models"
import { acceptData, ListFilter, FilterInfo, InfoPlace } from "../../_helpers/models/routeModels"

export class RouteBasicClass<M extends Model> {

  readonly path: string
  sequelizeData: ModelCtor<M>
  table: saveTable
  protected server: any
  protected filterlist?: RealListFilter = undefined

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
    } else if (created === false && olderValue !== undefined && olderValue !== null && info.allowNull && info.allowNull.keepOldValue) {
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

  public changeFilterList(filters?: ListFilter) {
    if (filters) {
      let toReturn: RealListFilter = {}

      Object.entries(filters).forEach(([keyCol, valueCol]) => {
        if (this.table.hasOwnProperty(keyCol)) {

          Object.entries(valueCol).forEach(([key, value]) => {
            let type = filterOperatorToSequelizeOperator(key)
            if (type !== undefined && autorizeFilterOperator(type, this.table[keyCol].type)) {
              let transform = undefined

              if (value.transformValue)
                transform = value.transformValue
              else if (this.table[keyCol].type.filterOperator.transform) {
                transform = this.table[keyCol].type.filterOperator.transform
              }

              if (toReturn[keyCol] === undefined)
                toReturn[keyCol] = {}
              toReturn[keyCol][type.name] = {
                info: type,
                name: value.name ? value.name : keyCol + '_' + type.reduce_name,
                where: value.where ? value.where : InfoPlace.QUERYPARAMS,
                transformValue: transform
              }
            }
          })

        }
      })
      this.filterlist = toReturn
    } else {
      this.filterlist = undefined
    }
  }

  protected getValueFrom(req: any, info: RealFilterInfo): any | undefined {
    if (info.where === InfoPlace.BODY) {
      return req.body[info.name]
    } else if (info.where === InfoPlace.HEADER) {
      return req.headers[info.name]
    } else if (info.where === InfoPlace.QUERYPARAMS) {
      return req.query[info.name]
    } else if (info.where === InfoPlace.PARAMS) {
      return req.params[info.name]
    } else {
      return undefined
    }
  }

  protected getFilter(req: any, filter?: RealListFilter): any | undefined {
    let toReturn: any = { where: {} }

    if (filter === undefined || Object.keys(filter).length === 0)
      return undefined

    Object.entries(filter).forEach(([keyCol, valueCol]) => {
      Object.entries(valueCol).forEach(([key, value]) => {
        let filterValue = this.getValueFrom(req, value)

        if (filterValue !== undefined) {
          if (value.transformValue)
            filterValue = value.transformValue(filterValue)
          if (toReturn.where[keyCol] === undefined)
            toReturn.where[keyCol] = {}
          toReturn.where[keyCol][value.info.sequilize_type] = filterValue
        }
      })
    })
    return toReturn
  }

  protected getValueFromRequest(req: any, info: RealFilterInfo): any | undefined {
    let filterValue = this.getValueFrom(req, info)

    if (filterValue !== undefined) {
      if (info.transformValue)
        filterValue = info.transformValue(filterValue)
      return filterValue
    }
    return undefined
  }
}