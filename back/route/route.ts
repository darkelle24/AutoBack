import { UserTableClass } from './../special-table/userTable';
import { access } from './../../_helpers/models/userTableModel';
import { acceptData, InfoPlace, ListFilter, ListValueInfo, RealFilterInfo, RealListFilter, RealListValueInfo, Route } from './../../_helpers/models/routeModels';
import { Model, ModelCtor } from "sequelize/types"
import { autorizeFilterOperator, filterOperatorToSequelizeOperator, removeFile } from "../../_helpers/fn"
import multer from 'multer';
import { routeTableInfo } from '../../_helpers/models/models';
import { ABDataType } from '../../_helpers/models/modelsType';
import { saveTable, saveDataTableInfo } from '../../_helpers/models/modelsTable';
import express, { RequestHandler } from 'express';

export class RouteBasicClass<M extends Model> {

  readonly path: string
  readonly sequelizeData: ModelCtor<M>
  readonly table: saveTable
  protected server: any
  protected filterlist?: RealListFilter = undefined
  protected dataAsList?: RealListValueInfo = undefined
  protected userTable?: UserTableClass<any> = undefined
  protected uploads?: multer.Multer
  protected files: any[] = []
  readonly pathFolder?: string

  constructor(table: routeTableInfo, sequelizeData: ModelCtor<M>, server: express.Application, path: string, userTable?: UserTableClass<any>) {
    this.sequelizeData = sequelizeData
    this.table = table.table
    this.server = server
    this.path = path
    this.userTable = userTable
    this.uploads = table.uploads
    this.pathFolder = table.pathFolder
    if (this.uploads)
      this.files = this.fileList()
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  protected setValue(value: any, info: saveDataTableInfo, created: boolean = true): any {
    let toReturn: any

    if (value !== undefined && value !== null) {
      toReturn = value
    } else if (created === false && value === undefined && info.keepOldValue) {
      toReturn = undefined
    } else if (created === true && value === undefined && info.defaultValue !== undefined) {
      toReturn = info.defaultValue
    } else {
      toReturn = null
    }
    return toReturn
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  protected getValue(value: any): any {
    return value
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  protected getAllValue(data: any) {
    Object.entries(this.table).forEach(([key]) => {
      data[key] = this.getValue(data[key])
    })
  }
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  protected list(data: any, accept: acceptData): any {
    if (accept.inverse)
      return this.blackList(data, accept)
    return this.whitelist(data, accept)
  }
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  protected blackList(data: any, accept: acceptData): any {
    if (accept.list && accept.list.length !== 0) {
      const toReturn: any = data
      const list: string[] = accept.list

      Object.entries(data).forEach(([key]) => {
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
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  protected whitelist(data: any, accept: acceptData): any {
    if (accept.list && accept.list.length !== 0) {
      const toReturn: any = {}
      const list: string[] = accept.list

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

  public changeFilterList(filters?: ListFilter): void {
    if (filters) {
      const toReturn: RealListFilter = {}

      Object.entries(filters).forEach(([keyCol, valueCol]) => {
        if (Object.prototype.hasOwnProperty.call(this.table, keyCol)) {

          Object.entries(valueCol).forEach(([key, value]) => {
            const type = filterOperatorToSequelizeOperator(key)
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

  protected getValueFrom(req: express.Request, place: InfoPlace, name: string): any | undefined {
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

  protected getFilter(req: express.Request, filter?: RealListFilter): any | undefined {
    const toReturn: any = { where: {} }

    if (filter === undefined || Object.keys(filter).length === 0)
      return undefined

    Object.entries(filter).forEach(([keyCol, valueCol]) => {
      Object.entries(valueCol).forEach(([, value]) => {
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

  protected getValueFromRequest(req: express.Request, info: RealFilterInfo): any | undefined {
    let filterValue = this.getValueFrom(req, info.where, info.name)

    if (filterValue !== undefined) {
      if (info.transformValue)
        filterValue = info.transformValue(filterValue)
      return filterValue
    }
    return undefined
  }

  public changeDataAsList(dataAs?: ListValueInfo): void {
    if (dataAs) {
      const toReturn: RealListValueInfo = {}

      Object.entries(dataAs).forEach(([keyCol, valueCol]) => {
        if (Object.prototype.hasOwnProperty.call(this.table, keyCol)) {
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

  protected getDataAs(req: express.Request, dataAs?: RealListValueInfo): undefined | void {
    if (dataAs === undefined || Object.keys(dataAs).length === 0)
      return undefined

    Object.entries(dataAs).forEach(([, valueCol]) => {
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

  public changeAccess(access?: access): boolean | void {
    if (access && this.userTable) {
      if (access.role) {
        access.role = access.role.filter((e) => {
          if (this.userTable && this.userTable.config.roles.find(el => el === e )) {
            return true
          }
          return false
        })
      }
    }
  }

  public checkToken(route: Route): RequestHandler  {
    return async (req: any, res: any, next: any) => {
      if (this.userTable) {
        const result = await this.userTable.checkToken(req, res, route)
        if (result) {
          next()
        }
      } else {
        next()
      }
    }
  }

  protected fileList(): any[] {
    const fields: any[] = []

    Object.entries(this.table).forEach(([key, value]) => {
      if (value.type.autobackDataType === ABDataType.FILE) {
        fields.push({name: key, maxCount: 1})
      }
    })
    return fields
  }

  protected dataToBody(): RequestHandler  {
    return (req, _res, next): void => {
      if (req.is('multipart/form-data')) {
        if (req.body.data) {
          req.body = JSON.parse(req.body.data)
          this.files.forEach((element) => {
            delete req.body[element.name]
          });
          Object.entries(req.files).forEach(([key, value]: [string, any]) => {
            req.body[key] = value[0].filename
          });
        } else {
          req.body = {}
          Object.entries(req.files).forEach(([key, value]: [string, any]) => {
            req.body[key] = value[0].filename
          });
        }
        next()
      } else {
        next()
      }
    }
  }

  protected uploadFile(): express.RequestHandler<any> {
    if (!this.uploads)
      throw Error("OK")
    const fields: any[] = []

    Object.entries(this.table).forEach(([key, value]) => {
      if (value.type.autobackDataType === ABDataType.FILE) {
        fields.push({name: key, maxCount: 1})
      }
    })
    return this.uploads.fields(fields)
  }

  protected ereaseAllNewFiles(req: express.Request): void {
    Object.entries(req.files).forEach(([, value]: [string, any]) => {
      removeFile(value[0].path)
    })
  }
}
