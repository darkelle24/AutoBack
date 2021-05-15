import { RealFilterInfo } from './../../_helpers/models/routeModels';
import { StatusCodes } from "http-status-codes";
import { Model, ModelCtor } from "sequelize";
import { saveTable } from "../../_helpers/models/models";
import { InfoPlace, RouteGet } from "../../_helpers/models/routeModels";
import { RouteBasicClass } from "./route";
import { UserTableClass } from 'back/special-table/userTable';

export class RouteGetClass<M extends Model> extends RouteBasicClass<M> {
  routeInfo: RouteGet

  constructor(table: saveTable, sequelizeData: ModelCtor<M>, server: any, path: string, routeInfo: RouteGet, userTable?: UserTableClass<any>) {
    super(table, sequelizeData, server, path, userTable)

    this.routeInfo = routeInfo
    this.changeFilterList(routeInfo.filters)
    this.changeAccess(routeInfo.auth)
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
    server.get(path, this.checkToken(routeInfo), (req: any, res: any) => {
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
      let toSend: any[] = []

      datas.every((value, index) => {
        toSend.push(value.get())
        if (route.returnColumns)
          toSend[index]= this.list(toSend[index], route.returnColumns)
        this.getAllValue(toSend[index])
        return true
      })
      if (route.beforeSend)
          route.beforeSend(req, res, this, toSend)
      return res.status(StatusCodes.OK).json(toSend)
    }).catch(err => {
      return res.status(400).json(err)
    })
  }
}