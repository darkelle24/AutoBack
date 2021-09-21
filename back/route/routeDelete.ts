import { UserTableClass } from "back/special-table/userTable";
import { Model, ModelCtor } from "sequelize";
import { errorHandling, infoPlaceToString, removeFile, typeRouteToString } from "../../_helpers/fn";
import { RouteDelete } from "../../_helpers/models/routeModels";
import { RouteBasicClass } from "./route";
import path from 'path';
import { routeTableInfo } from "../../_helpers/models/models";
import express from "express";

export class RouteDeleteClass<M extends Model> extends RouteBasicClass<M> {
  routeInfo: RouteDelete

  constructor(table: routeTableInfo, sequelizeData: ModelCtor<M>, server: express.Application, path: string, routeInfo: RouteDelete, userTable?: UserTableClass<any>) {
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

  private gestDeleteRoute(req: express.Request, res: express.Response, route: RouteDelete): any {
    return this.sequelizeData.findOne(this.getFilter(req, this.filterlist)).then(data => {
      if (!data) {
        return res.status(404).json({ message: "Not found" })
      }
      const fileToDestroy: any[] = []

      const pathFolder = this.pathFolder || ''
      this.files.forEach((element: any) => {
        const value = data.getDataValue(element.name)
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

  getInfoRoute(): any {
    const toReturn: any = {
      type: typeRouteToString(this.routeInfo.type),
      route: this.path,
      auth: this.routeInfo.auth ? this.routeInfo.auth.role : "No need to be login to have access to this route.",
      filter: {},
      description: this.routeInfo.description
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
    return toReturn
  }
}