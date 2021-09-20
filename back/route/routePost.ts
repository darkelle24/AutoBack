import { UserTableClass } from "back/special-table/userTable";
import express from "express";
import { Model, ModelCtor } from "sequelize";
import { addPath, errorHandling, infoPlaceToString, typeRouteToString } from "../../_helpers/fn";
import { routeTableInfo } from "../../_helpers/models/models";
import { RoutePost } from "../../_helpers/models/routeModels";
import { RouteBasicClass } from "./route";

export class RoutePostClass<M extends Model> extends RouteBasicClass<M> {
  routeInfo: RoutePost

  constructor(table: routeTableInfo, sequelizeData: ModelCtor<M>, server: express.Application, path: string, routeInfo: RoutePost, userTable?: UserTableClass<any>) {
    super(table, sequelizeData, server, path, userTable)

    this.routeInfo = routeInfo
    this.changeDataAsList(routeInfo.dataAs)
    this.changeAccess(routeInfo.auth)

    if (routeInfo.fileReturnWithHost === undefined)
      routeInfo.fileReturnWithHost = true

    if (this.uploads) {
      server.post(path, this.checkToken(routeInfo), this.uploads.fields(this.files), this.dataToBody(), (req: express.Request, res: express.Response) => {
        this.toDo(req, res)
      })
    } else {
      server.post(path, this.checkToken(routeInfo), (req: express.Request, res: express.Response) => {
        this.toDo(req, res)
      })
    }
  }

  protected toDo(req: express.Request, res: express.Response): any {
    try {
      if (!this.routeInfo.doSomething)
        this.gestPostRoute(req, res, this.routeInfo)
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

  private gestPostRoute(req: express.Request, res: express.Response, route: RoutePost): any {
    const toReturn: any = {}

    if (route.columsAccept && req.body)
      req.body = this.list(req.body, route.columsAccept)
    this.getDataAs(req, this.dataAsList)
    if (route.beforeSetValue)
        route.beforeSetValue(req, res, this)
    Object.entries(this.table).forEach(([key, value]) => {
      if (value.autoIncrement === false) {
        toReturn[key] = this.setValue(req.body[key], value)
      }
    })

    return this.sequelizeData.create(
      toReturn
    ).then(data => {
      let toSend = data.get()

      if (route.returnColumns && toSend)
        toSend = this.list(toSend, route.returnColumns)
      this.getAllValue(toSend)
      if (route.beforeSend)
        route.beforeSend(req, res, this, toSend)
      if (this.uploads && this.routeInfo.fileReturnWithHost && this.files) {
        this.files.forEach((element) => {
          if (Object.prototype.hasOwnProperty.call(toSend, element.name) && toSend[element.name]) {
            toSend[element.name] = addPath(req.protocol + '://' + req.headers.host, toSend[element.name])
          }
        })
      }
      this.tableClass.getLinkDataRecursive(toSend, -1)
        .then(() => res.status(201).json(toSend))
        .catch(err => errorHandling(err, res))
    }).catch(err => {
      return errorHandling(err, res)
    })
  }

  getInfoRoute(): any {
    let toReturn: any = {
      type: typeRouteToString(this.routeInfo.type),
      route: this.path,
      auth: this.routeInfo.auth ? this.routeInfo.auth.role : "No need to be login to have access to this route.",
      description: this.routeInfo.description
    }
    return toReturn
  }
}