import { UserTableClass } from "back/special-table/userTable";
import { Model, ModelCtor } from "sequelize";
import { saveTable } from "../../_helpers/models/models";
import { RoutePost } from "../../_helpers/models/routeModels";
import { RouteBasicClass } from "./route";

export class RoutePostClass<M extends Model> extends RouteBasicClass<M> {
  routeInfo: RoutePost

  constructor(table: saveTable, sequelizeData: ModelCtor<M>, server: any, path: string, routeInfo: RoutePost, userTable?: UserTableClass<any>) {
    super(table, sequelizeData, server, path, userTable)

    this.routeInfo = routeInfo
    this.changeDataAsList(routeInfo.dataAs)
    this.changeAccess(routeInfo.auth)
    server.post(path, this.checkToken(routeInfo), (req: any, res: any) => {
      if (!routeInfo.doSomething)
        return this.gestPostRoute(req, res, routeInfo)
      else {
        return routeInfo.doSomething(req, res, this)
      }
    })
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
      data = data.get()
      if (route.returnColumns && data)
        data = this.list(data, route.returnColumns)
      this.getAllValue(data)
      if (route.beforeSend)
          route.beforeSend(req, res, this, data)
      return res.status(200).json(data)
    })
  }
}