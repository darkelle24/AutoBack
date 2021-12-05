import { UserTableClass } from "back/special-table/userTable";
import express from "express";
import { StatusCodes } from "http-status-codes";
import { Model, ModelCtor } from "sequelize";
import { errorHandling, infoPlaceToString, typeRouteToString } from "../../_helpers/fn";
import { routeTableInfo } from "../../_helpers/models/models";
import { RoutePut } from "../../_helpers/models/routeModels";
import { RouteBasicClass } from "./route";

export class RoutePutClass<M extends Model> extends RouteBasicClass<M> {
  routeInfo: RoutePut

  constructor(table: routeTableInfo, sequelizeData: ModelCtor<M>, server: express.Application, path: string, routeInfo: RoutePut, userTable?: UserTableClass<any>) {
    super(table, sequelizeData, server, path, userTable)

    this.routeInfo = routeInfo
    this.changeFilterList(routeInfo.filters)
    this.changeDataAsList(routeInfo.dataAs)
    this.changeAccess(routeInfo.auth)

    if (this.routeInfo.socketNotif === undefined) {
      this.routeInfo.socketNotif = {activate: true, toSendForNotif: undefined, selectUserSendNotifs: undefined}
    }

    if (routeInfo.fileReturnWithHost === undefined)
      routeInfo.fileReturnWithHost = true

    if (this.uploads) {
      let upload = this.uploads.fields(this.files)
      server.put(path, this.checkToken(routeInfo), (req, res, next) => {upload(req, res, (err: any) => {if (err) {errorHandling(err, res)} else next()})}, this.dataToBody(), async (req: any, res: any) => {
        await Promise.resolve(this.toDo(req, res))
      })
    } else {
      server.put(path, this.checkToken(routeInfo), async (req: any, res: any) => {
        await Promise.resolve(this.toDo(req, res))
      })
    }
  }

  protected async toDo(req: express.Request, res: express.Response): Promise<any> {
    try {
      if (!this.routeInfo.doSomething)
        await Promise.resolve(this.gestPutRoute(req, res, this.routeInfo))
      else {
        await Promise.resolve(this.routeInfo.doSomething(req, res, this))
      }
    } catch (err) {
      console.error(err)
      res.status(500).send(err);
      res.statusMessage = err.toString()
    }
    if (res.statusCode !== 200 && req.files) {
        this.ereaseAllNewFiles(req)
    }
  }

  private gestPutRoute(req: any, res: any, route: RoutePut): any {
    return this.sequelizeData.findOne(this.getFilter(req, this.filterlist)).then(async data => {
      if (!data) {
        res.status(404).json({ message: "Not found" })
        res.statusMessage = "Not found"
        return res
      }

      const toReturn: any = {}

      if (route.columsAccept && req.body)
        req.body = this.list(req.body, route.columsAccept)
      this.getDataAs(req, this.dataAsList)
      if (route.beforeSetValue)
        await Promise.resolve(route.beforeSetValue(req, res, this, data))
      Object.entries(this.table).forEach(([key, value]) => {
        if (value.autoIncrement === false) {
          toReturn[key] = this.setValue(req.body[key], value, false)
        }
      })

      return data.update(toReturn).then(async updatedObject => {

        let toSend = updatedObject.get()

        if (route.returnColumns && toSend)
          toSend = this.list(toSend, route.returnColumns)
        this.getAllValue(toSend)
        if (route.beforeSend)
          await Promise.resolve(route.beforeSend(req, res, this, toSend))
        if (this.uploads && this.routeInfo.fileReturnWithHost && this.files) {
          this.files.forEach((element) => {
            if (Object.prototype.hasOwnProperty.call(toSend, element.name) && toSend[element.name]) {
              toSend[element.name] = req.protocol + '://' + req.headers.host + toSend[element.name]
            }
          })
        }

        this.tableClass.getLinkData(toSend)
        .then(async () => {
          if (route.beforeSendAfterRecursive)
            await Promise.resolve(route.beforeSendAfterRecursive(req, res, this, toSend))

          if (this.tableClass.socket) {
            this.tableClass.socket.sendNotif(req, data, 'PUT', this.routeInfo.socketNotif)
          }

          res.status(StatusCodes.OK).json(toSend)
        })
        .catch(err => errorHandling(err, res))

      }).catch(err => {
        return errorHandling(err, res)
      })
    }).catch(err => {
      return errorHandling(err, res)
    })
  }

  private transformDataAsInfo(key: any, value: any): any {
    if (key && typeof key === "string") {
      if (key === 'transformValue')
        return undefined
      if (key === 'where')
        return infoPlaceToString(value)
    }
    return value
  }

  getInfoRoute(): any {
    const toReturn: any = {
      type: typeRouteToString(this.routeInfo.type),
      route: this.path,
      auth: this.routeInfo.auth ? this.routeInfo.auth.role : "No need to be login to have access to this route.",
      filter: {},
      name: this.routeInfo.name ? this.routeInfo.name : this.path,
      event: this.routeInfo.event,
      description: this.routeInfo.description,
      dataAs: this.routeInfo.dataAs ? JSON.parse(JSON.stringify(this.routeInfo.dataAs, this.transformDataAsInfo)) : undefined
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
}