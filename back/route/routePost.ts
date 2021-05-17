import { UserTableClass } from "back/special-table/userTable";
import { Model, ModelCtor } from "sequelize";
import { routeTableInfo, saveTable } from "../../_helpers/models/models";
import { RoutePost } from "../../_helpers/models/routeModels";
import { RouteBasicClass } from "./route";

export class RoutePostClass<M extends Model> extends RouteBasicClass<M> {
  routeInfo: RoutePost

  constructor(table: routeTableInfo, sequelizeData: ModelCtor<M>, server: any, path: string, routeInfo: RoutePost, userTable?: UserTableClass<any>) {
    super(table, sequelizeData, server, path, userTable)

    this.routeInfo = routeInfo
    this.changeDataAsList(routeInfo.dataAs)
    this.changeAccess(routeInfo.auth)

    if (this.uploads) {
      let files = this.fileList()
      server.post(path, this.checkToken(routeInfo), this.uploads.fields(files), this.dataToBody(), (req: any, res: any) => {
        this.toDo(req, res)
      })
    } else {
      server.post(path, this.checkToken(routeInfo), (req: any, res: any) => {
        this.toDo(req, res)
      })
    }
  }

  protected toDo(req: any, res: any): any {
    try {
      if (!this.routeInfo.doSomething)
        return this.gestPostRoute(req, res, this.routeInfo)
      else {
        return this.routeInfo.doSomething(req, res, this)
      }
    } catch (err) {
      console.error(err)
      res.status(500).send(err);
    }
  }

  private gestPostRoute(req: any, res: any, route: RoutePost): any {
    let toReturn: any = {}

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
      return res.status(200).json(toSend)
    }).catch(err => {
      if (err.errors !== undefined) {
        return res.status(400).json({ message: err.name + ': ' + err.errors[0].message })
      }
      return res.status(400).json({ message: err.toString() })
    })
  }
}