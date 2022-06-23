import { UserTableClass } from "back/special-table/userTable";
import express from "express";
import { Model, ModelCtor } from "sequelize";
import { addPath, errorHandling, infoPlaceToString, typeRouteToString } from "../../_helpers/fn";
import { routeTableInfo } from "../../_helpers/models/models";
import { RoutePost } from "../../_helpers/models/routeModels";
import { RouteBasicClass } from "./route";
import { AutoBackRouteError } from "../../_helpers/error";

export class RoutePostClass<M extends Model> extends RouteBasicClass<M> {
  routeInfo: RoutePost

  constructor(table: routeTableInfo, sequelizeData: ModelCtor<M>, server: express.Application, path: string, routeInfo: RoutePost, userTable?: UserTableClass<any>) {
    super(table, sequelizeData, server, path, userTable)

    this.routeInfo = routeInfo
    this.changeDataAsList(routeInfo.dataAs)
    this.changeAccess(routeInfo.auth)

    if (this.routeInfo.socketNotif === undefined) {
      this.routeInfo.socketNotif = { activate: true, toSendForNotif: undefined, selectUserSendNotifs: undefined }
    }

    /* if (this.tableClass.upload && this.tableClass.haveFile) {
      let upload = this.tableClass.upload.fields(this.files)
      server.post(path, this.checkToken(routeInfo), (req, res, next) => { upload(req, res, (err: any) => { if (err) { errorHandling(err, res) } else next() }) }, this.dataToBody(), async (req: express.Request, res: express.Response) => {
        await this.toDo(req, res)
      })
    } else { */
      server.post(path, this.checkToken(routeInfo), async (req: express.Request, res: express.Response) => {
        await this.toDo(req, res)
      })
   /*  } */
  }

  protected async toDo(req: express.Request, res: express.Response): Promise<any> {
    try {
      if (!this.routeInfo.doSomething)
        await Promise.resolve(this.gestPostRoute(req, res, this.routeInfo))
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

  private async gestPostRoute(req: express.Request, res: express.Response, route: RoutePost): Promise<any> {
    const toReturn: any = {}

    if (route.columsAccept && req.body)
      req.body = this.list(req.body, route.columsAccept)
    this.getDataAs(req, this.dataAsList)
    if (route.beforeSetValue) {
      try {
        await Promise.resolve(route.beforeSetValue(req, res, this))
      } catch (err) {
        if (err instanceof AutoBackRouteError) {
          return errorHandling(err, res, err.code)
        }
        return errorHandling(err, res)
      }
    }
    Object.entries(this.table).forEach(([key, value]) => {
      if (value.autoIncrement === false) {
        toReturn[key] = this.setValue(req.body[key], value)
      }
    })

    return this.sequelizeData.create(
      toReturn
    ).then(async data => {
      let toSend = data.get()

      if (route.returnColumns && toSend)
        toSend = this.list(toSend, route.returnColumns)
      this.getAllValue(toSend)
      if (route.beforeSend)
        await Promise.resolve(route.beforeSend(req, res, this, toSend))
      /* if (this.uploads && this.routeInfo.fileReturnWithHost && this.files) {
        this.files.forEach((element) => {
          if (Object.prototype.hasOwnProperty.call(toSend, element.name) && toSend[element.name]) {
            toSend[element.name] = addPath(req.protocol + '://' + req.headers.host, toSend[element.name])
          }
        })
      } */
      this.tableClass.getLinkDataRecursive(toSend, -1)
        .then(async () => {
          if (route.beforeSendAfterRecursive)
            await Promise.resolve(route.beforeSendAfterRecursive(req, res, this, toSend))

          if (this.tableClass.socket) {
            this.tableClass.socket.sendNotif(req, toSend, 'POST', this.routeInfo.socketNotif)
          }

          res.status(201).json(toSend)
        })
        .catch(err => {
          if (err instanceof AutoBackRouteError) {
            return errorHandling(err, res, err.code)
          }
          return errorHandling(err, res)
        })
    }).catch(err => {
      if (err instanceof AutoBackRouteError) {
        return errorHandling(err, res, err.code)
      }
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
      description: this.routeInfo.description,
      returnColumns: this.routeInfo.returnColumns,
      columsAccept: this.routeInfo.columsAccept,
      dataAs: this.routeInfo.dataAs ? JSON.parse(JSON.stringify(this.routeInfo.dataAs, this.transformDataAsInfo)) : undefined,
      name: this.routeInfo.name ? this.routeInfo.name : this.path,
      bodyDoc: this.routeInfo.bodyDoc,
      event: this.routeInfo.event
    }

    return toReturn
  }
}