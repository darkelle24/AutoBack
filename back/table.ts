import { FileTableClass } from './special-table/fileTable';
import { UserTableClass } from './special-table/userTable';
import { RoutePostClass } from './route/routePost';
import { allRoutes, RouteDelete, RoutePut, RouteGet, RoutePost, RouteClass, InfoPlace, basicRouteParams, basicPostPutRouteParams } from './../_helpers/models/routeModels';
import { Model, ModelCtor, Op } from "sequelize";
import { Route, TypeRoute } from "../_helpers/models/routeModels";
import { activeAllFiltersForAllCols, addPath, getFileExtansion, getPathTable, getRowInTableLink, getRowInTableMultipleLink } from '../_helpers/fn';
import { RouteGetClass } from './route/routeGet';
import { RoutePutClass } from './route/routePut';
import { RouteDeleteClass } from './route/routeDelete';
import { access } from '../_helpers/models/userTableModel';
import { DeleteAction, realDataFileTable, realDataLinkTable, saveTable, TableLinktoThisTable } from '../_helpers/models/modelsTable';
import { ABDataType } from '../_helpers/models/modelsType';
import express from 'express';
import { ValidationOptions } from 'sequelize/types/lib/instance-validator';
import { SocketAutobackClass } from './socket';
import { SocketConstructor, SocketInfo } from '_helpers/models/socketModels';
import multer from 'multer';

export class TableClass<M extends Model> {
  readonly name: string
  sequelizeData: ModelCtor<M>
  table: saveTable
  protected server: express.Application
  routes: allRoutes = { originRoutePath: '/', get: [], post: [], put: [], delete: [] }
  activeBasicRouting = false
  userTable?: UserTableClass<any> = undefined
  fileTable?: FileTableClass<any> = undefined
  upload?: multer.Multer
  haveFile: boolean = false
  description?: string
  socket?: SocketAutobackClass

  private _listLinkColumns?: string[] = undefined
  get listLinkColumns(): string[] | undefined {
    return this._listLinkColumns
  }

  private _tableLinktoThisTable: TableLinktoThisTable[] = []
  get tableLinktoThisTable(): TableLinktoThisTable[] {
    return this._tableLinktoThisTable
  }

  constructor(name: string, table: saveTable, server: express.Application, originServerPath: string, fileTable?: FileTableClass<any>, originRoutePath?: string, userTable?: UserTableClass<any>, description: string = '', socketInfo?: SocketConstructor) {
    this.table = table
    this.name = name
    this.server = server
    this.userTable = userTable
    this.description = description
    this.fileTable = fileTable

    this.routes.originRoutePath = getPathTable(name, originServerPath, originRoutePath)

    if (socketInfo)
      this.socket = new SocketAutobackClass(socketInfo)
  }

  public setUpSequilize(sequelizeData: ModelCtor<M>): void {
    this.sequelizeData = sequelizeData
    this.getLinkColumns()
    this.addHook()
    if (this.haveFile && this.fileTable) {
      this.upload = this.fileTable.getMulter(this.table)
    }
  }

  private addHook() {
    this.sequelizeData.addHook('afterDestroy', 'onDestroyLinks', async (instance: any): Promise<void> => {
      await this.onDeletedAction(instance.dataValues)
    })

    if (this._listLinkColumns && this._listLinkColumns.length !== 0) {
      this.sequelizeData.addHook('beforeValidate', 'checkTableLinkExist', async (instance: any, option: ValidationOptions) => {
        if (option.fields) {
          for (const element of option.fields) {
            if (this.table[element] && this.table[element].type.isTableLink) {
              const dataLinkTable = (this.table[element] as realDataLinkTable)
              if (instance.dataValues[element] !== null && instance.dataValues[element] !== undefined) {
                let result
                if (dataLinkTable.subType !== ABDataType.MULTIPLE_LINK_TABLE) {
                  result = await getRowInTableLink(dataLinkTable.columnsLink, dataLinkTable.tableToLink.sequelizeData, instance.dataValues[element])
                  if (!result) {
                    throw new Error('Not found row with value ' + instance.dataValues[element] + ' in the table ' + dataLinkTable.tableToLink.name + ' in the column ' + dataLinkTable.columnsLink)
                  }
                } else {
                  result = await getRowInTableMultipleLink(dataLinkTable.columnsLink, dataLinkTable.tableToLink.sequelizeData, JSON.parse(instance.dataValues[element]))
                  if (!result || result.some((result: any) => result === null)) {
                    throw new Error('Not found row with value ' + instance.dataValues[element] + ' in the table ' + dataLinkTable.tableToLink.name + ' in the column ' + dataLinkTable.columnsLink)
                  }
                }
              }
            }
          }
        }
      })
    }
  }

  basicRouting(getRoute: basicRouteParams = {}, postRoute: basicPostPutRouteParams = {}, putRoute: basicPostPutRouteParams = {}, deleteRoute: basicRouteParams = {}): void {
    if (!this.activeBasicRouting) {
      this.activeBasicRouting = true

      if (getRoute && (getRoute.active || getRoute.active === undefined))
        this.basicGet(getRoute.auth)
      if (postRoute && (postRoute.active || postRoute.active === undefined))
        this.basicPost(postRoute.auth, postRoute.uploadFile)
      if (putRoute && (putRoute.active || putRoute.active === undefined))
        this.basicPut(putRoute.auth, putRoute.uploadFile)
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
      auth: accessRule,
      name: 'Get ' + this.name + 's'
    })
  }

  protected basicPost(accessRule?: access, uploadFile?: boolean): void {
    if (this.table['id'] && this.table['id'].primaryKey && this.table['id'].autoIncrement) {
      this.addRoute({
        path: '/',
        columsAccept: {
          list: ['id'],
          inverse: true
        },
        type: TypeRoute.POST,
        auth: accessRule,
        uploadFile: uploadFile,
        name: 'Post ' + this.name
      })
    } else {
      this.addRoute({
        path: '/',
        type: TypeRoute.POST,
        auth: accessRule,
        name: 'Post ' + this.name,
        uploadFile: uploadFile
      })
    }
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
            transformValue: (value: string) => { return parseInt(value) }
          }
        }
      },
      auth: accessRule,
      name: 'Delete ' + this.name
    })
  }

  protected basicPut(accessRule?: access, uploadFile?: boolean): void {
    this.addRoute({
      path: '/:id',
      type: TypeRoute.PUT,
      columsAccept: {
        list: ['id'],
        inverse: true
      },
      filters: {
        id: {
          equal: {
            name: 'id',
            where: InfoPlace.PARAMS,
            transformValue: (value: string) => { return parseInt(value) }
          }
        }
      },
      auth: accessRule,
      name: 'Put ' + this.name,
      uploadFile: uploadFile
    })
  }

  addRoute(route: Route): RouteClass | undefined {
    switch (route.type) {
      case TypeRoute.POST: {
        const routeClass = new RoutePostClass({ classTable: this }, this.sequelizeData, this.server, addPath(this.routes.originRoutePath, route.path), (route as RoutePost), this.userTable)
        this.routes.post.push(routeClass)
        return routeClass
      }
      case TypeRoute.GET: {
        const routeClass = new RouteGetClass({ classTable: this }, this.sequelizeData, this.server, addPath(this.routes.originRoutePath, route.path), (route as RouteGet), this.userTable)
        this.routes.get.push(routeClass)
        return routeClass
      }
      case TypeRoute.PUT: {
        const routeClass = new RoutePutClass({ classTable: this }, this.sequelizeData, this.server, addPath(this.routes.originRoutePath, route.path), (route as RoutePut), this.userTable)
        this.routes.put.push(routeClass)
        return routeClass
      }
      case TypeRoute.DELETE: {
        const routeClass = new RouteDeleteClass({ classTable: this }, this.sequelizeData, this.server, addPath(this.routes.originRoutePath, route.path), (route as RouteDelete), this.userTable)
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

        if ((<any>value).type.isFile) {
          this.haveFile = true
        }
      }
    });
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  protected removeNeverShow(tableLink: realDataLinkTable, data: any): any {
    for (const [key, value] of Object.entries(tableLink.tableToLink.table)) {
      if (value.neverShow) {
        delete data[key]
      }
    }
    return data
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  protected getLinkDataSingle(tableLink: realDataLinkTable, data: any, element: string): Promise<any> {
    return getRowInTableLink(tableLink.columnsLink, tableLink.tableToLink.sequelizeData, data[element], tableLink.multipleResult)
      .then(async result => {
        if (!tableLink.multipleResult) {
          if (tableLink.rename) {
            data[tableLink.rename] = this.removeNeverShow(tableLink, result.get())
            if (tableLink.transformGetLinkedData)
              await Promise.resolve(tableLink.transformGetLinkedData(data[tableLink.rename]))
            delete data[element]
          } else {
            data[element] = this.removeNeverShow(tableLink, result.get())
            if (tableLink.transformGetLinkedData)
              await Promise.resolve(tableLink.transformGetLinkedData(data[element]))
          }
        } else {
          data[tableLink.rename || element] = []
          await Promise.all(result.map(async (element: any) => {
            data[tableLink.rename || element].push(this.removeNeverShow(tableLink, element.get()))
            if (tableLink.transformGetLinkedData)
              await Promise.resolve(tableLink.transformGetLinkedData(data[tableLink.rename || element]))
          }));
          if (tableLink.rename)
            delete data[element]
        }
      }).catch(() => {
        throw new Error('Not found row with value ' + data[element] + ' in the table ' + tableLink.tableToLink.name + ' in the column ' + tableLink.columnsLink)
      })
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  protected getLinkDataArray(tableLink: realDataLinkTable, data: any[], index: number): Promise<any> {
    return getRowInTableLink(tableLink.columnsLink, tableLink.tableToLink.sequelizeData, data[index], tableLink.multipleResult)
      .then(async result => {
        if (!tableLink.multipleResult) {
          data[index] = this.removeNeverShow(tableLink, result.get())
          if (tableLink.transformGetLinkedData)
            await Promise.resolve(tableLink.transformGetLinkedData(data[index]))
        } else {
          data[index] = []
          await Promise.all(result.map(async (element: any) => {
            data[index].push(this.removeNeverShow(tableLink, element.get()))
            if (tableLink.transformGetLinkedData)
              await Promise.resolve(tableLink.transformGetLinkedData(data[index]))
          }));
        }
      }).catch(() => {
        throw new Error('Not found row with value ' + data[index] + ' in the table ' + tableLink.tableToLink.name + ' in the column ' + tableLink.columnsLink)
      })
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  protected getLinkDataMultiple(tableLink: realDataLinkTable, data: any, element: string): Promise<any> {
    return Promise.all(data[element].map(async (_oneData: any, index: number) => {
      return this.getLinkDataArray(tableLink, data[element], index)
    })).then(() => {
      if (tableLink.rename) {
        data[tableLink.rename] = data[element]
        delete data[element]
      }
    })
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public async getLinkData(data: any): Promise<unknown> {
    if (this._listLinkColumns && this._listLinkColumns.length !== 0 && data) {
      return Promise.all(this._listLinkColumns.map(async (element) => {
        if (data[element] !== undefined && data[element] !== null) {
          const tableLink = (this.table[element] as realDataLinkTable)
          if (tableLink.subType === ABDataType.TABLE_LINK)
            return this.getLinkDataSingle(tableLink, data, element)
          else if (tableLink.subType === ABDataType.MULTIPLE_LINK_TABLE) {
            return this.getLinkDataMultiple(tableLink, data, element)
          }
        }
      }))
    }
  }

  public async getLinkArray(data: any[]): Promise<unknown> {
    return Promise.all(data.map(async (_element: any, index: number) => {
      return this.getLinkData(data[index])
    }))
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  protected async linkDataRecursiveMultiple(data: any, depth: number): Promise<unknown> {
    if (this._listLinkColumns && this._listLinkColumns.length !== 0 && data) {
      return Promise.all(this._listLinkColumns.map(async (element) => {
        const tableLink = (this.table[element] as realDataLinkTable)
        return tableLink.tableToLink.getLinkDataRecursive(data[tableLink.rename || tableLink.columnsLink], depth - 1, tableLink.subType === ABDataType.MULTIPLE_LINK_TABLE).then(res => res)
      }))
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  protected async checkDataIsArrayRecursive(data: any, depth: number, isMultipleLink: boolean = false): Promise<unknown> {
    if (isMultipleLink && Array.isArray(data)) {
      return Promise.all(data.map(async (element: any, index: number) => {
        return this.getSingleLinkDataRecursive(data[index], depth)
      }))
    } else {
      return this.getSingleLinkDataRecursive(data, depth)
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public async getSingleLinkDataRecursive(data: any, depth: number): Promise<unknown> {
    return this.getLinkData(data)
      .then(() => {
        return this.linkDataRecursiveMultiple(data, depth)
      })
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public async getLinkDataRecursive(data: any, depth: number, isMultipleLink: boolean = false): Promise<unknown> {
    if (depth !== 0) {
      return this.checkDataIsArrayRecursive(data, depth, isMultipleLink)
    }
  }

  public addLinkToThisTable(table: TableClass<any>, columnsLink: string): void {
    this.tableLinktoThisTable.push({ table: table, columns: columnsLink })
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  protected async onDeletedActionNullOrDefault(data: any, table: realDataLinkTable, oneTableInfo: TableLinktoThisTable, value: any): Promise<unknown> {
    const filter: any = {}
    filter.where = {}
    if (table.subType !== ABDataType.MULTIPLE_LINK_TABLE) {
      filter.where[oneTableInfo.columns] = data[table.columnsLink]

      return oneTableInfo.table.sequelizeData.findAll(filter)
        .then((datas: any[]) => {
          return datas.map((onedata: any) => {
            onedata[oneTableInfo.columns] = value
            return onedata.save({ fields: [oneTableInfo.columns] }).then((info: any) => info)
          })
        })
    } else {
      filter.where[oneTableInfo.columns] = {
        [Op.not]: null,
        [Op.ne]: '[]'
      }

      return oneTableInfo.table.sequelizeData.findAll(filter)
        .then((returnData: any[]) => {
          return Promise.all(returnData.map(async (element) => {
            const getValue = element.get(oneTableInfo.columns)
            if (getValue !== null && getValue !== undefined && Array.isArray(getValue) && getValue.length !== 0) {
              let newArray
              if (value === null) {
                newArray = getValue.filter((info: any) => {
                  if (info !== data[table.columnsLink]) {
                    return true
                  }
                  return false
                })
              } else {
                newArray = getValue.map((info: any) => {
                  if (info === data[table.columnsLink]) {
                    return value
                  }
                  return info
                })
              }
              element[oneTableInfo.columns] = newArray
              return element.save()
            }
          }))
        })
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  protected async onDeletedActionDelete(data: any, table: realDataLinkTable, oneTableInfo: TableLinktoThisTable): Promise<unknown> {
    const filter: any = {}
    filter.where = {}
    if (table.subType !== ABDataType.MULTIPLE_LINK_TABLE) {
      filter.where[oneTableInfo.columns] = data[table.columnsLink]

      return oneTableInfo.table.sequelizeData.findAll(filter)
        .then((returnData: any[]) => {
          return Promise.all(returnData.map(async (element) => element.destroy()))
        })
    } else {
      filter.where[oneTableInfo.columns] = {
        [Op.not]: null,
        [Op.ne]: '[]'
      }

      return oneTableInfo.table.sequelizeData.findAll(filter)
        .then((returnData: any[]) => {
          return Promise.all(returnData.map(async (element) => {
            const value = element.get(oneTableInfo.columns)
            if (value !== null && value !== undefined && Array.isArray(value) && value.length !== 0 && value.find(info => info === data[table.columnsLink])) {
              return element.destroy()
            }
          }))
        })
    }
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

  public getTableInfo(): any {
    const toReturn: any = {
      routes: this.getInfoRoute(),
      column: this.getInfoColumn(),
      description: this.description
    }
    return toReturn
  }

  private transformColumnsInfo(key: any, value: any) {
    if (key && typeof key === "string" && (key === 'sequelizeType' || key === 'tableToLink' || key === 'JsonToDB' || key === 'DBToJson' || key === 'sequilize_type')) {
      return undefined;
    }
    return value;
  }

  public getInfoColumn(): any {
    const toReturn: any = {}

    for (const [key, value] of Object.entries(this.table)) {
      toReturn[key] = JSON.parse(JSON.stringify(value, this.transformColumnsInfo))
      if ((<realDataLinkTable>value).tableToLink) {
        toReturn[key].tableToLink = (<realDataLinkTable>value).tableToLink.name
      }
    }

    return toReturn
  }

  public getInfoRoute(): any {
    const toReturn: any = {}

    toReturn.get = []
    for (const route of this.routes.get) {
      toReturn.get.push(route.getInfoRoute())
    }

    toReturn.put = []
    for (const route of this.routes.put) {
      toReturn.put.push(route.getInfoRoute())
    }

    toReturn.post = []
    for (const route of this.routes.post) {
      toReturn.post.push(route.getInfoRoute())
    }

    toReturn.delete = []
    for (const route of this.routes.delete) {
      toReturn.delete.push(route.getInfoRoute())
    }
    return toReturn
  }
}