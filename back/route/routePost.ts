import { Model, ModelCtor } from "sequelize";
import { saveTable } from "../../_helpers/models/models";
import { RoutePost } from "../../_helpers/models/routeModels";
import { RouteBasicClass } from "./route";

export class RoutePostClass<M extends Model> extends RouteBasicClass<M> {
  routeInfo: RoutePost

  constructor(table: saveTable, sequelizeData: ModelCtor<M>, server: any, path: string, routeInfo: RoutePost) {
    super(table, sequelizeData, server, path)

    this.routeInfo = routeInfo
    server.post(path, (req: any, res: any) => {
      return this.gestPostRoute(req, res, routeInfo)
    })
  }

  private gestPostRoute(req: any, res: any, route: RoutePost): any {
    let toReturn: any = {}
    let body: any = req.body

    if (route.columsAccept && req.body)
      body = this.list(req.body, route.columsAccept)
    Object.entries(this.table).forEach(([key, value]) => {
      if (value.primaryKey === false) {
        toReturn[key] = this.setValue(body[key], value)
      }
    })

    return this.sequelizeData.create(
      toReturn
    ).then(data => {
      data = data.get()
      if (route.returnColumns && data)
        data = this.list(data, route.returnColumns)
      return res.status(200).json(data)
    })
  }
}