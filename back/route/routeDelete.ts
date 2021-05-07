import { Model, ModelCtor } from "sequelize";
import { saveTable } from "../../_helpers/models/models";
import { RouteDelete } from "../../_helpers/models/routeModels";
import { RouteBasicClass } from "./route";

export class RouteDeleteClass<M extends Model> extends RouteBasicClass<M> {
  routeInfo: RouteDelete

  constructor(table: saveTable, sequelizeData: ModelCtor<M>, server: any, path: string, routeInfo: RouteDelete) {
    super(table, sequelizeData, server, path)

    this.routeInfo = routeInfo
    server.delete(path, (req: any, res: any) => {
      return this.gestDeleteRoute(req, res, routeInfo)
    })
  }

  private gestDeleteRoute(req: any, res: any, route: RouteDelete): any {
    return this.sequelizeData.findOne({ where: { id: req.params.id } }).then(data => {
      if (!data) {
        return res.status(404).json({ message: "Treatment " + req.params.id + " not found" })
      }

      return (data.destroy().then(() => {
        return res.status(200).json({
            message: "Deleted"
        })
      }))
    })
  }
}