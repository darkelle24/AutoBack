import { RealFilterInfo } from './../../_helpers/models/routeModels';
import { StatusCodes } from "http-status-codes";
import { Model, ModelCtor } from "sequelize";
import { routeTableInfo } from "../../_helpers/models/models";
import { InfoPlace, RouteGet } from "../../_helpers/models/routeModels";
import { RouteBasicClass } from "./route";
import { UserTableClass } from 'back/special-table/userTable';
import { errorHandling, infoPlaceToString, typeRouteToString } from "../../_helpers/fn";
import express from 'express';

export class RouteGetClass<M extends Model> extends RouteBasicClass<M> {
  routeInfo: RouteGet

  constructor(table: routeTableInfo, sequelizeData: ModelCtor<M>, server: express.Application, path: string, routeInfo: RouteGet, userTable?: UserTableClass<any>) {
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
    if (routeInfo.fileReturnWithHost === undefined)
      routeInfo.fileReturnWithHost = true

    server.get(path, this.checkToken(routeInfo), (req: express.Request, res: express.Response) => {
      try {
      if (!routeInfo.doSomething)
        return this.gestGetRoute(req, res, routeInfo)
      else {
        return routeInfo.doSomething(req, res, this)
        }
      } catch (err) {
        console.error(err)
        res.status(500).send(err);
        res.statusMessage = err.toString()
      }
    })
  }

  private gestGetRoute(req: express.Request, res: express.Response, route: RouteGet): any {
    const filter = this.getFilter(req, this.filterlist)

    if (route.limit)
      filter['limit'] = this.getValueFromRequest(req, (route.limit as RealFilterInfo))
    if (route.offset)
      filter['offset'] = this.getValueFromRequest(req, (route.offset as RealFilterInfo))
    this.getInfoRoute()
    return this.sequelizeData.findAll(filter).then(async datas => {
      const toSend: any[] = []

      datas.every((value, index) => {
        toSend.push(value.get())
        if (route.returnColumns)
          toSend[index]= this.list(toSend[index], route.returnColumns)
        this.getAllValue(toSend[index])
        return true
      })
      if (route.beforeSend)
        route.beforeSend(req, res, this, toSend)
      if (this.uploads && this.routeInfo.fileReturnWithHost && this.files) {
        toSend.forEach((oneInfo: any) => {
          this.files.forEach((element) => {
            if (Object.prototype.hasOwnProperty.call(oneInfo, element.name) && oneInfo[element.name]) {
              oneInfo[element.name] = req.protocol + '://' + req.headers.host + oneInfo[element.name]
            }
          })
        })
      }
      return this.getAllLinkData(toSend)
        .then(() => res.status(StatusCodes.OK).json(toSend))
        .catch(err => errorHandling(err, res))
    }).catch(err => {
      return errorHandling(err, res)
    })
  }

  private async getAllLinkData(toSend: any[]): Promise<unknown> {
    if (this.listLinkData.length !== 0) {
      return Promise.all(toSend.map(async (oneInfo) => {
        return await this.tableClass.getLinkDataRecursive(oneInfo, -1)
      }));
    }
  }

  getInfoRoute(): any {
    const toReturn: any = {
      type: typeRouteToString(this.routeInfo.type),
      route: this.path,
      auth: this.routeInfo.auth ? this.routeInfo.auth.role : "No need to be login to have access to this route.",
      filter: {},
      description: this.routeInfo.description,
      name: this.routeInfo.name ? this.routeInfo.name : this.path,
      event: this.routeInfo.event
    }

    for (const [keyFilter, valueFilter] of Object.entries(this.filterlist)) {
      let newFilter: any = undefined
      for (const [, valueValueFilter] of Object.entries(valueFilter)) {
        newFilter = {
          filter: valueValueFilter.info.name,
          name: valueValueFilter.name,
          where: ""
        }

        newFilter.where = infoPlaceToString(valueValueFilter.where)

        if (newFilter) {
          if (!toReturn.filter[keyFilter])
            toReturn.filter[keyFilter] = {}
          toReturn.filter[keyFilter][newFilter.filter] = newFilter
        }
      }
    }

    if (this.routeInfo.limit) {
      toReturn.limit = {
        filter: 'Limit',
        name: 'limit',
        where: infoPlaceToString(this.routeInfo.limit.where)
      }
    }
    if (this.routeInfo.offset) {
      toReturn.offset = {
        filter: 'Offset',
        name: 'offset',
        where: infoPlaceToString(this.routeInfo.offset.where)
      }
    }
    return toReturn
  }
}