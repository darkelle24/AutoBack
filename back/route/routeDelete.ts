import { UserTableClass } from "back/special-table/userTable";
import { Model, ModelCtor } from "sequelize";
import { saveTable } from "../../_helpers/models/models";
import { RouteDelete } from "../../_helpers/models/routeModels";
import { RouteBasicClass } from "./route";

export class RouteDeleteClass<M extends Model> extends RouteBasicClass<M> {
  routeInfo: RouteDelete

  constructor(table: saveTable, sequelizeData: ModelCtor<M>, server: any, path: string, routeInfo: RouteDelete, userTable?: UserTableClass<any>) {
    super(table, sequelizeData, server, path, userTable)

    this.routeInfo = routeInfo
    this.changeFilterList(routeInfo.filters)
    this.changeAccess(routeInfo.auth)
    server.delete(path, this.checkToken(routeInfo), (req: any, res: any) => {
      if (!routeInfo.doSomething)
        return this.gestDeleteRoute(req, res, routeInfo)
      else {
        return routeInfo.doSomething(req, res, this)
      }
    })
  }

  private gestDeleteRoute(req: any, res: any, route: RouteDelete): any {
    return this.sequelizeData.findOne(this.getFilter(req, this.filterlist)).then(data => {
      if (!data) {
        return res.status(404).json({ message: "Not found" })
      }
      if (route.beforeDelete)
        route.beforeDelete(req, res, this)
      return (data.destroy().then(() => {
        return res.status(200).json({
            message: "Deleted"
        })
      }).catch(err => {
        return res.status(400).json(err)
      }))
    }).catch(err => {
      return res.status(400).json(err)
    })
  }
}