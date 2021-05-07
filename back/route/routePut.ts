import { Model, ModelCtor } from "sequelize";
import { saveTable } from "../../_helpers/models/models";
import { RoutePut } from "../../_helpers/models/routeModels";
import { RouteBasicClass } from "./route";

export class RoutePutClass<M extends Model> extends RouteBasicClass<M> {
  routeInfo: RoutePut

  constructor(table: saveTable, sequelizeData: ModelCtor<M>, server: any, path: string, routeInfo: RoutePut) {
    super(table, sequelizeData, server, path)

    this.routeInfo = routeInfo
    this.changeFilterList(routeInfo.filters)
    server.put(path, (req: any, res: any) => {
      return this.gestPutRoute(req, res, routeInfo)
    })
  }

  private gestPutRoute(req: any, res: any, route: RoutePut): any {
    return this.sequelizeData.findOne({ where: { id: req.params.id } }).then(data => {
      if (!data) {
        return res.status(404).json({ message: "Treatment " + req.params.id + " not found" })
      }

      let toReturn: any = {}
      let body: any = req.body

      if (route.columsAccept && req.body)
        body = this.list(req.body, route.columsAccept)

      Object.entries(this.table).forEach(([key, value]) => {
        if (value.primaryKey === false) {
          toReturn[key] = this.setValue(body[key], value, false, data.getDataValue(key))
        }
      })

      return data.update(toReturn).then(updatedObject => {
        updatedObject = updatedObject.get()
        if (route.returnColumns && updatedObject)
          updatedObject = this.list(updatedObject, route.returnColumns)
        return res.status(200).json(updatedObject)
      })
    })
  }
}