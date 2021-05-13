import { RealFilterInfo } from './../../_helpers/models/routeModels';
import { StatusCodes } from "http-status-codes";
import { Model, ModelCtor } from "sequelize";
import { saveTable } from "../../_helpers/models/models";
import { InfoPlace, RouteGet } from "../../_helpers/models/routeModels";
import { RouteBasicClass } from "./route";

export class RouteGetClass<M extends Model> extends RouteBasicClass<M> {
  routeInfo: RouteGet

  constructor(table: saveTable, sequelizeData: ModelCtor<M>, server: any, path: string, routeInfo: RouteGet) {
    super(table, sequelizeData, server, path)

    this.routeInfo = routeInfo
    this.changeFilterList(routeInfo.filters)
    if (routeInfo.limit) {
      routeInfo.limit.name = routeInfo.limit.name ? routeInfo.limit.name : 'limit',
      routeInfo.limit.where = routeInfo.limit.where !== undefined ? routeInfo.limit.where : InfoPlace.QUERYPARAMS
      routeInfo.limit.transformValue = routeInfo.limit.transformValue ? routeInfo.limit.transformValue : (value: any) => {
        if (typeof value === 'string')
          return parseInt(value)
        return value
      }
    }
    if (routeInfo.offset) {
      routeInfo.offset.name = routeInfo.offset.name ? routeInfo.offset.name : 'offset',
      routeInfo.offset.where = routeInfo.offset.where !== undefined ? routeInfo.offset.where : InfoPlace.QUERYPARAMS
      routeInfo.offset.transformValue = routeInfo.offset.transformValue ? routeInfo.offset.transformValue : (value: any) => {
        if (typeof value === 'string')
          return parseInt(value)
        return value
      }
    }
    server.get(path, (req: any, res: any) => {
      if (!routeInfo.doSomething)
        return this.gestGetRoute(req, res, routeInfo)
      else {
        return routeInfo.doSomething(req, res, this)
      }
    })
  }

  private gestGetRoute(req: any, res: any, route: RouteGet): any {
    let filter = this.getFilter(req, this.filterlist)

    if (route.limit)
      filter['limit'] = this.getValueFromRequest(req, (route.limit as RealFilterInfo))
    if (route.offset)
      filter['offset'] = this.getValueFromRequest(req, (route.offset as RealFilterInfo))

    return this.sequelizeData.findAll(filter).then(datas => {
      datas.every((value, index) => {
        value = value.get()
        if (route.returnColumns)
          datas[index] = this.list(value, route.returnColumns)
        this.getAllValue(datas[index])
        return true
      })
      if (route.beforeSend)
          route.beforeSend(req, res, this, datas)
      return res.status(StatusCodes.OK).json(datas)
    })
  }
}