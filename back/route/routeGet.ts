import { StatusCodes } from "http-status-codes";
import { Model, ModelCtor } from "sequelize";
import { saveTable } from "../../_helpers/models/models";
import { RouteGet } from "../../_helpers/models/routeModels";
import { RouteBasicClass } from "./route";

export class RouteGetClass<M extends Model> extends RouteBasicClass<M> {
  routeInfo: RouteGet

  constructor(table: saveTable, sequelizeData: ModelCtor<M>, server: any, path: string, routeInfo: RouteGet) {
    super(table, sequelizeData, server, path)

    this.routeInfo = routeInfo
    this.changeFilterList(routeInfo.filters)
    server.get(path, (req: any, res: any) => {
      return this.gestGetRoute(req, res, routeInfo)
    })
  }

  private gestGetRoute(req: any, res: any, route: RouteGet): any {

    return this.sequelizeData.findAll(this.getFilter(req, this.filterlist)).then(datas => {
      datas.every((value, index) => {
        value = value.get()
        if (route.columsAccept)
          datas[index] = this.list(value, route.columsAccept)
        this.getAllValue(datas[index])
        return true
      })
      return res.status(StatusCodes.OK).json(datas)
    })
  }
}