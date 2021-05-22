import { UserTableClass } from './special-table/userTable';
import { RoutePostClass } from './route/routePost';
import { allRoutes, RouteDelete, RoutePut, RouteGet, RoutePost, RouteClass, InfoPlace, basicRouteParams } from './../_helpers/models/routeModels';
import { Model, ModelCtor } from "sequelize";
import { Route, TypeRoute } from "../_helpers/models/routeModels";
import { activeAllFiltersForAllCols, addPath, getFileExtansion, getRowInTableLink } from '../_helpers/fn';
import { RouteGetClass } from './route/routeGet';
import { RoutePutClass } from './route/routePut';
import { RouteDeleteClass } from './route/routeDelete';
import { access } from '../_helpers/models/userTableModel';
import multer from 'multer'
import fs from 'fs'
import path from 'path';
import { DeleteAction, realDataLinkTable, saveTable, TableLinktoThisTable } from '../_helpers/models/modelsTable';
import { ABDataType } from '../_helpers/models/modelsType';
import express from 'express';
import { ValidationOptions } from 'sequelize/types/lib/instance-validator';

export class TableClass<M extends Model> {
  readonly name: string
  sequelizeData: ModelCtor<M>
  table: saveTable
  private server: express.Application
  routes: allRoutes = { originRoutePath: '/', get: [], post: [], put: [], delete: [] }
  activeBasicRouting = false
  private userTable?: UserTableClass<any> = undefined
  readonly upload?: multer.Multer
  readonly pathFolder?: string

  private _listLinkColumns?: string[] = undefined
  get listLinkColumns(): string[] | undefined  {
    return this._listLinkColumns
  }

  private _tableLinktoThisTable: TableLinktoThisTable[] = []
  get tableLinktoThisTable(): TableLinktoThisTable[]  {
    return this._tableLinktoThisTable
  }

  constructor(name: string, table: saveTable, sequelizeData: ModelCtor<M>, server: express.Application, filePath: string, originServerPath: string, originRoutePath?: string, userTable?: UserTableClass<any>) {
    this.sequelizeData = sequelizeData
    this.table = table
    this.name = name
    this.server = server
    this.userTable = userTable
    if (originRoutePath)
      this.routes.originRoutePath = addPath('/', addPath(originServerPath, originRoutePath))
    else
      this.routes.originRoutePath = addPath('/', addPath(addPath(originServerPath, '/'), name))

    const haveFile = Object.values(this.table).some((value: any) => { return value.type.autobackDataType === ABDataType.FILE })

    if (haveFile) {
      const pathFolder = path.join(filePath, name)

      const storage = multer.diskStorage({
        destination: function (req, file, cb) {
          if (!fs.existsSync(path.join(pathFolder, file.fieldname))){
            fs.mkdirSync(path.join(pathFolder, file.fieldname), { recursive: true });
          }
          cb(null, path.join(pathFolder, file.fieldname))
        },
        filename: function (req, file, cb) {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) + '-' + file.fieldname
          const ext = getFileExtansion(file.originalname)

          if (!ext)
            cb(null, uniqueSuffix)
          else
            cb(null, uniqueSuffix + ext)
        }
      })

      this.upload = multer({
        storage: storage
      });
      this.pathFolder = pathFolder
    }
    this.getLinkColumns()
    this.addHook()
  }

  private addHook() {
    this.sequelizeData.addHook('afterDestroy', 'onDestroyLinks', (instance: any): void => {
      this.onDeletedAction(instance.dataValues)
    })

    if (this._listLinkColumns && this._listLinkColumns.length !== 0) {
      this.sequelizeData.addHook('beforeValidate', 'checkTableLinkExist', async (instance: any, option: ValidationOptions) => {
        if (option.fields) {
          for (const element of option.fields) {
            if (this.table[element] && this.table[element].type.isTableLink) {
              const dataLinkTable = (this.table[element] as realDataLinkTable)
              const result = await getRowInTableLink(dataLinkTable.columnsLink, dataLinkTable.tableToLink.sequelizeData, instance.dataValues[element])
              if (!result) {
                throw new Error('Not found row with value ' + instance.dataValues[element] + ' in the table ' + dataLinkTable.tableToLink.name + ' in the column ' + dataLinkTable.columnsLink)
              }
            }
          }
        }
      })
    }
  }

  basicRouting(getRoute: basicRouteParams = {}, postRoute: basicRouteParams = {}, putRoute: basicRouteParams = {}, deleteRoute: basicRouteParams = {}): void {
    if (!this.activeBasicRouting) {
      this.activeBasicRouting = true
      if (getRoute && (getRoute.active || getRoute.active === undefined))
        this.basicGet(getRoute.auth)
      if (postRoute && (postRoute.active || postRoute.active === undefined))
        this.basicPost(postRoute.auth)
      if (putRoute && (putRoute.active || putRoute.active === undefined))
        this.basicPut(putRoute.auth)
      if (deleteRoute && (deleteRoute.active || deleteRoute.active === undefined))
        this.basicDelete(deleteRoute.auth)
    } else {
      console.error('Already activate basic routing on table ' + this.name)
    }
  }

  protected basicGet(accessRule?: access): void {
    this.addRoute({
      path: '/',
      type: TypeRoute.GET,
      filters: activeAllFiltersForAllCols(this.table),
      limit: {},
      offset: {},
      auth: accessRule
    })
  }

  protected basicPost(accessRule?: access): void {
    this.addRoute({
      path: '/',
      type: TypeRoute.POST,
      auth: accessRule
    })
  }

  protected basicDelete(accessRule?: access): void {
    this.addRoute({
      path: '/:id',
      type: TypeRoute.DELETE,
      filters: {
        id: {
          equal: {
            name: 'id',
            where: InfoPlace.PARAMS,
            transformValue: (value: string) => {return parseInt(value)}
          }
        }
      },
      auth: accessRule
    })
  }

  protected basicPut(accessRule?: access): void {
    this.addRoute({
      path: '/:id',
      type: TypeRoute.PUT,
      filters: {
        id: {
          equal: {
            name: 'id',
            where: InfoPlace.PARAMS,
            transformValue: (value: string) => {return parseInt(value)}
          }
        }
      },
      auth: accessRule
    })
  }

  addRoute(route: Route): RouteClass | undefined {
    switch (route.type) {
      case TypeRoute.POST: {
        const routeClass = new RoutePostClass({ classTable: this, uploads: this.upload, pathFolder: this.pathFolder}, this.sequelizeData, this.server, addPath(this.routes.originRoutePath, route.path), (route as RoutePost), this.userTable)
        this.routes.post.push(routeClass)
        return routeClass
      }
      case TypeRoute.GET: {
        const routeClass = new RouteGetClass({ classTable: this, uploads: this.upload, pathFolder: this.pathFolder}, this.sequelizeData, this.server, addPath(this.routes.originRoutePath, route.path), (route as RouteGet), this.userTable)
        this.routes.get.push(routeClass)
        return routeClass
      }
      case TypeRoute.PUT: {
        const routeClass = new RoutePutClass({ classTable: this, uploads: this.upload, pathFolder: this.pathFolder}, this.sequelizeData, this.server, addPath(this.routes.originRoutePath, route.path), (route as RoutePut), this.userTable)
        this.routes.put.push(routeClass)
        return routeClass
      }
      case TypeRoute.DELETE: {
        const routeClass = new RouteDeleteClass({ classTable: this, uploads: this.upload, pathFolder: this.pathFolder}, this.sequelizeData, this.server, addPath(this.routes.originRoutePath, route.path), (route as RouteDelete), this.userTable)
        this.routes.delete.push(routeClass)
        return routeClass
      }
      default: {
        return undefined
      }
    }
  }

  private getLinkColumns(): void {
    this._listLinkColumns = []

    Object.entries(this.table).forEach(([key, value]) => {
      if (value.type.isTableLink && this._listLinkColumns && Object.prototype.hasOwnProperty.call(this.table[key], 'tableToLink')) {
        const tableToLink = (this.table[key] as realDataLinkTable)
        this._listLinkColumns.push(key)
        tableToLink.tableToLink.addLinkToThisTable(this, key)
      }
    });
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public async getLinkData(data: any): Promise<unknown> {
    if (this._listLinkColumns && this._listLinkColumns.length !== 0) {
      return Promise.all(this._listLinkColumns.map(async (element) => {
        if (data[element] !== undefined && data[element] !== null) {
          const tableLink = (this.table[element] as realDataLinkTable)
          return getRowInTableLink(tableLink.columnsLink, tableLink.tableToLink.sequelizeData, data[element])
            .then(result => {
              if (tableLink.rename) {
                data[tableLink.rename] = result.get()
                delete data[element]
              } else
                data[element] = result.get()
            }).catch(() => {
              throw new Error('Not found row with value ' + data[element] + ' in the table ' + tableLink.tableToLink.name + ' in the column ' + tableLink.columnsLink)
            })
        }
      }))
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public async getLinkDataRecursive(data: any, depth: number): Promise<unknown> {
    if (depth !== 0) {
      return this.getLinkData(data).then(
        () => {
          if (this._listLinkColumns && this._listLinkColumns.length !== 0) {
            return Promise.all(this._listLinkColumns.map(async (element) => {
              const tableLink = (this.table[element] as realDataLinkTable)
              return tableLink.tableToLink.getLinkDataRecursive(data[tableLink.rename || tableLink.columnsLink], depth - 1).then(res => res)
            }))
          }
        }
      )
    }
  }

  public addLinkToThisTable(table: TableClass<any>, columnsLink: string): void {
    this.tableLinktoThisTable.push({table: table, columns: columnsLink})
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  protected async onDeletedActionNullOrDefault(data: any, table: realDataLinkTable, oneTableInfo: TableLinktoThisTable, value: any): Promise<unknown> {
    const filter: any = {}
    filter.where = {}
    filter.where[oneTableInfo.columns] = data[table.columnsLink]

    return oneTableInfo.table.sequelizeData.findAll(filter)
      .then((data: any) => {
        data[oneTableInfo.columns] = value
        return data.save({ fields: [oneTableInfo.columns] }).then((data: any) => data)
      })
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  protected async onDeletedActionDelete(data: any, table: realDataLinkTable, oneTableInfo: TableLinktoThisTable): Promise<unknown> {
    const filter: any = {}
    filter.where = {}
    filter.where[oneTableInfo.columns] = data[table.columnsLink]

    return oneTableInfo.table.sequelizeData.findAll(filter)
      .then((data: any[]) => {
        return Promise.all(data.map(async (element) => element.destroy()))
      })
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  protected async onDeletedAction(data: any): Promise<unknown> {
    return Promise.all(this.tableLinktoThisTable.map(async (oneTableInfo) => {
      const castTable = (oneTableInfo.table.table[oneTableInfo.columns] as realDataLinkTable)
      if (castTable.onDelete === DeleteAction.SET_NULL) {
        return this.onDeletedActionNullOrDefault(data, castTable, oneTableInfo, null)
      } else if (castTable.onDelete === DeleteAction.SET_DEFAULT) {
        return this.onDeletedActionNullOrDefault(data, castTable, oneTableInfo, castTable.defaultValue)
      } else if (castTable.onDelete === DeleteAction.DELETE) {
        return this.onDeletedActionDelete(data, castTable, oneTableInfo)
      }
    }))
  }
}