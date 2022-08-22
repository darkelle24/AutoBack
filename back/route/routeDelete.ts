import { UserTableClass } from "back/special-table/userTable";
import { Model, ModelCtor } from "sequelize";
import { errorHandling, infoPlaceToString, removeFile, typeRouteToString } from "../../_helpers/fn";
import { RouteDelete } from "../../_helpers/models/routeModels";
import { RouteBasicClass } from "./route";
import path from 'path';
import { routeTableInfo } from "../../_helpers/models/models";
import express from "express";
import { AutoBackRouteError } from "../../_helpers/error";

export class RouteDeleteClass<M extends Model> extends RouteBasicClass<M> {
  routeInfo: RouteDelete

  constructor(table: routeTableInfo, sequelizeData: ModelCtor<M>, server: express.Application, path: string, routeInfo: RouteDelete, userTable?: UserTableClass<any>) {
    super(table, sequelizeData, server, path, userTable)

    this.routeInfo = routeInfo
    this.changeFilterList(routeInfo.filters)
    this.changeFilterDocList(routeInfo.filtersDoc)
    this.changeAccess(routeInfo.auth)

    if (this.routeInfo.socketNotif === undefined) {
      this.routeInfo.socketNotif = { activate: true, toSendForNotif: undefined, selectUserSendNotifs: undefined }
    }

    server.delete(path, this.checkToken(routeInfo), async (req: any, res: any) => {
      try {
        if (!routeInfo.doSomething)
          return await Promise.resolve(this.gestDeleteRoute(req, res, routeInfo))
        else {
          return await Promise.resolve(routeInfo.doSomething(req, res, this))
        }
      } catch (err) {
        console.error(err)
        res.status(500).send(err);
      }
    })
  }

  private gestDeleteRoute(req: express.Request, res: express.Response, route: RouteDelete): any {
    return this.sequelizeData.findOne(this.getFilter(req, this.filterlist)).then(async data => {
      if (!data) {
        return res.status(404).json({ message: "Not found" })
      }
      const fileToDestroy: any[] = []

      const toDestroy = this.detectFileDestroy(data)

      if (route.beforeDelete)
        await Promise.resolve(route.beforeDelete(req, res, this, data))

      return (data.destroy().then(async () => {

        if (toDestroy.length !== 0) {
          toDestroy.forEach((element) => {
            if (element.oldId !== null)
              this.tableClass.fileTable.deleteFile(element.oldId)
          })
        }

        let data = { message: "Deleted" }

        if (route.beforeSend)
          await Promise.resolve(route.beforeSend(req, res, this, data))

        if (this.tableClass.socket) {
          this.tableClass.socket.sendNotif(req, data, 'DELETE', this.routeInfo.socketNotif)
        }

        return res.status(200).json(data)
      }).catch(err => {
        if (err instanceof AutoBackRouteError) {
          return errorHandling(err, res, err.code)
        }
        return errorHandling(err, res)
      }))
    }).catch(err => {
      if (err instanceof AutoBackRouteError) {
        return errorHandling(err, res, err.code)
      }
      return errorHandling(err, res)
    })
  }

  getInfoRoute(): any {
    const toReturn: any = {
      type: typeRouteToString(this.routeInfo.type),
      route: this.path,
      auth: this.routeInfo.auth ? this.routeInfo.auth.role : "No need to be login to have access to this route.",
      filter: {},
      description: this.routeInfo.description,
      name: this.routeInfo.name ? this.routeInfo.name : this.path,
      event: this.routeInfo.event
    }

    if (this.filterListDoc) {
      for (const [keyFilter, valueFilter] of Object.entries(this.filterListDoc)) {
        let newFilter: any = undefined

          newFilter = {
            filter: valueFilter.description,
            name: valueFilter.name,
            where: ""
          }

          newFilter.where = infoPlaceToString(valueFilter.where)

          if (newFilter) {
            if (!toReturn.filter[keyFilter])
              toReturn.filter[keyFilter] = {}
            toReturn.filter[keyFilter][valueFilter.name] = newFilter
          }

      }
    }

    if (this.filterlist) {
      for (const [keyFilter, valueFilter] of Object.entries(this.filterlist)) {
        let newFilter: any = undefined
        for (const [, valueValueFilter] of Object.entries(valueFilter)) {
          newFilter = {
            filter: valueValueFilter.info.name,
            name: valueValueFilter.name,
            where: ""
          }

          newFilter.where = infoPlaceToString(valueValueFilter.where)

          if (newFilter) {
            if (!toReturn.filter[keyFilter])
              toReturn.filter[keyFilter] = {}
            toReturn.filter[keyFilter][newFilter.filter] = newFilter
          }
        }
      }
    }
    return toReturn
  }

  protected detectFileDestroy(oldValue: M, takeAll: boolean = false): { fieldName: string, oldId: number | null }[] {
    let toDestroy: any[] = []

    if (this.tableClass.haveFile && this.files) {
      this.files.forEach((element: any) => {
        let value = oldValue.getDataValue(element.name)
        if (typeof value === "string") {
          value = parseInt(value)
        }
        if (((<any>this.table[element.name]).type.deleteOldFileOnDelete && !takeAll) || takeAll) {
          toDestroy.push({ fieldName: element.name, oldId: value })
        }
      })
    }
    return toDestroy
  }
}