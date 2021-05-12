import { access } from './../../_helpers/models/userTableModel';
import { ListValueInfo, RealFilterInfo, RealListFilter, RealListValueInfo } from './../../_helpers/models/routeModels';
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
  protected dataAsList?: RealListValueInfo = undefined

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
    return this.whitelist(data, accept)
  }

  protected blackList(data: any, accept: acceptData): any {
    if (accept.list && accept.list.length !== 0) {
      let toReturn: any = data
      let list: string[] = accept.list

      Object.entries(data).forEach(([key, value]) => {
        if (list.find(element => element === key))
          delete toReturn[key]
      })
      return toReturn
    } else if (accept.list !== undefined && (accept.list === null || accept.list.length === 0)) {
      return data
    } else if (accept.list === undefined) {
      return {}
    }
  }

  protected whitelist(data: any, accept: acceptData): any {
    if (accept.list && accept.list.length !== 0) {
      let toReturn: any = {}
      let list: string[] = accept.list

      Object.entries(data).forEach(([key, value]) => {
        if (list.find(element => element === key))
          toReturn[key] = value
      })
      return toReturn
    } else if (accept.list !== undefined && (accept.list === null || accept.list.length === 0)) {
      return {}
    } else if (accept.list === undefined) {
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
                where: value.where !== undefined ? value.where : InfoPlace.QUERYPARAMS,
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

  protected getValueFrom(req: any, place: InfoPlace, name: string): any | undefined {
    if (place === InfoPlace.BODY) {
      return req.body[name]
    } else if (place === InfoPlace.HEADER) {
      return req.headers[name]
    } else if (place === InfoPlace.QUERYPARAMS) {
      return req.query[name]
    } else if (place === InfoPlace.PARAMS) {
      return req.params[name]
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
        let filterValue = this.getValueFrom(req, value.where, value.name)

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
    let filterValue = this.getValueFrom(req, info.where, info.name)

    if (filterValue !== undefined) {
      if (info.transformValue)
        filterValue = info.transformValue(filterValue)
      return filterValue
    }
    return undefined
  }

  public changeDataAsList(dataAs?: ListValueInfo) {
    if (dataAs) {
      let toReturn: RealListValueInfo = {}

      Object.entries(dataAs).forEach(([keyCol, valueCol]) => {
        if (this.table.hasOwnProperty(keyCol)) {
              let transform = undefined

              if (valueCol.transformValue)
                transform = valueCol.transformValue
              toReturn[keyCol] = {
                name: valueCol.name ? valueCol.name : keyCol,
                where: valueCol.where !== undefined ? valueCol.where : InfoPlace.BODY,
                transformValue: transform ? transform : undefined,
                force: valueCol.force === false ? false : true
              }

        }
      })
      this.dataAsList = toReturn
    } else {
      this.dataAsList = undefined
    }
  }

  protected getDataAs(req: any, dataAs?: RealListValueInfo) {
    if (dataAs === undefined || Object.keys(dataAs).length === 0)
      return undefined

    Object.entries(dataAs).forEach(([keyCol, valueCol]) => {
      if ((!valueCol.force && (req.body[valueCol.name] === undefined || req.body[valueCol.name] === null)) || valueCol.force) {
        let valueFind = this.getValueFrom(req, valueCol.where, valueCol.name)

        if (valueFind !== undefined) {
          if (valueCol.transformValue)
            valueFind = valueCol.transformValue(valueFind)
          req.body[valueCol.name] = valueFind
        }
      }
    })
  }

  protected checkAuth(req: any) {
  }
}