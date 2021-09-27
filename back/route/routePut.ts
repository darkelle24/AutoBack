import { UserTableClass } from "back/special-table/userTable";
import express from "express";
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

    if (routeInfo.fileReturnWithHost === undefined)
      routeInfo.fileReturnWithHost = true

    if (this.uploads) {
      server.put(path, this.checkToken(routeInfo), this.uploads.fields(this.files), this.dataToBody(), (req: any, res: any) => {
        this.toDo(req, res)
      })
    } else {
      server.put(path, this.checkToken(routeInfo), (req: any, res: any) => {
        this.toDo(req, res)
      })
    }
  }

  protected toDo(req: express.Request, res: express.Response): any {
    try {
      if (!this.routeInfo.doSomething)
        this.gestPutRoute(req, res, this.routeInfo)
      else {
        this.routeInfo.doSomething(req, res, this)
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
    return this.sequelizeData.findOne(this.getFilter(req, this.filterlist)).then(data => {
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
        route.beforeSetValue(req, res, this)
      Object.entries(this.table).forEach(([key, value]) => {
        if (value.autoIncrement === false) {
          toReturn[key] = this.setValue(req.body[key], value, false)
        }
      })

      return data.update(toReturn).then(updatedObject => {

        let toSend = updatedObject.get()

        if (route.returnColumns && toSend)
          toSend = this.list(toSend, route.returnColumns)
        this.getAllValue(toSend)
        if (route.beforeSend)
          route.beforeSend(req, res, this, toSend)
        if (this.uploads && this.routeInfo.fileReturnWithHost && this.files) {
          this.files.forEach((element) => {
            if (Object.prototype.hasOwnProperty.call(toSend, element.name) && toSend[element.name]) {
              toSend[element.name] = req.protocol + '://' + req.headers.host + toSend[element.name]
            }
          })
        }

        this.tableClass.getLinkData(toSend)
        .then(() => res.status(200).json(toSend))
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
    return toReturn
  }
}