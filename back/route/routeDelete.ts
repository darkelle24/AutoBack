import { UserTableClass } from "back/special-table/userTable";
import { Model, ModelCtor } from "sequelize";
import { errorHandling, removeFile } from "../../_helpers/fn";
import { RouteDelete } from "../../_helpers/models/routeModels";
import { RouteBasicClass } from "./route";
import path from 'path';
import { routeTableInfo } from "../../_helpers/models/models";

export class RouteDeleteClass<M extends Model> extends RouteBasicClass<M> {
  routeInfo: RouteDelete

  constructor(table: routeTableInfo, sequelizeData: ModelCtor<M>, server: any, path: string, routeInfo: RouteDelete, userTable?: UserTableClass<any>) {
    super(table, sequelizeData, server, path, userTable)

    this.routeInfo = routeInfo
    this.changeFilterList(routeInfo.filters)
    this.changeAccess(routeInfo.auth)
    server.delete(path, this.checkToken(routeInfo), (req: any, res: any) => {
      try {
        if (!routeInfo.doSomething)
          return this.gestDeleteRoute(req, res, routeInfo)
        else {
          return routeInfo.doSomething(req, res, this)
        }
      } catch (err) {
        console.error(err)
        res.status(500).send(err);
      }
    })
  }

  private gestDeleteRoute(req: any, res: any, route: RouteDelete): any {
    return this.sequelizeData.findOne(this.getFilter(req, this.filterlist)).then(data => {
      if (!data) {
        return res.status(404).json({ message: "Not found" })
      }
      let fileToDestroy: any[] = []

      let pathFolder = this.pathFolder || ''
      this.files.forEach((element: any) => {
        let value = data.getDataValue(element.name)
        if (value)
          fileToDestroy.push( path.join(pathFolder, element.name, value))
      })
      if (route.beforeDelete)
        route.beforeDelete(req, res, this)

      return (data.destroy().then(() => {
        fileToDestroy.forEach((element) => {
          removeFile(element)
        })
        return res.status(200).json({
            message: "Deleted"
        })
      }).catch(err => {
        return errorHandling(err, res)
      }))
    }).catch(err => {
      return errorHandling(err, res)
    })
  }
}