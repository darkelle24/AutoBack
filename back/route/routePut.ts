import { UserTableClass } from "back/special-table/userTable";
import { Model, ModelCtor } from "sequelize";
import { routeTableInfo, saveTable } from "../../_helpers/models/models";
import { RoutePut } from "../../_helpers/models/routeModels";
import { RouteBasicClass } from "./route";

export class RoutePutClass<M extends Model> extends RouteBasicClass<M> {
  routeInfo: RoutePut

  constructor(table: routeTableInfo, sequelizeData: ModelCtor<M>, server: any, path: string, routeInfo: RoutePut, userTable?: UserTableClass<any>) {
    super(table, sequelizeData, server, path, userTable)

    this.routeInfo = routeInfo
    this.changeFilterList(routeInfo.filters)
    this.changeDataAsList(routeInfo.dataAs)
    this.changeAccess(routeInfo.auth)
    server.put(path, this.checkToken(routeInfo), (req: any, res: any) => {
      try {
        if (!routeInfo.doSomething)
          return this.gestPutRoute(req, res, routeInfo)
        else {
          return routeInfo.doSomething(req, res, this)
        }
      } catch (err) {
        console.error(err)
        res.status(500).send(err);
      }
    })
  }

  private gestPutRoute(req: any, res: any, route: RoutePut): any {
    return this.sequelizeData.findOne(this.getFilter(req, this.filterlist)).then(data => {
      if (!data) {
        return res.status(404).json({ message: "Not found" })
      }

      let toReturn: any = {}

      if (route.columsAccept && req.body)
        req.body = this.list(req.body, route.columsAccept)
      this.getDataAs(req, this.dataAsList)
      if (route.beforeSetValue)
        route.beforeSetValue(req, res, this)
      Object.entries(this.table).forEach(([key, value]) => {
        if (value.autoIncrement === false) {
          toReturn[key] = this.setValue(req.body[key], value, false, data.getDataValue(key))
        }
      })

      return data.update(toReturn).then(updatedObject => {

        let toSend = updatedObject.get()

        if (route.returnColumns && toSend)
          toSend = this.list(toSend, route.returnColumns)
        this.getAllValue(toSend)
        if (route.beforeSend)
            route.beforeSend(req, res, this, toSend)
        return res.status(200).json(toSend)

      }).catch(err => {
        return res.status(400).json(err)
      })
    }).catch(err => {
      return res.status(400).json(err)
    })
  }
}