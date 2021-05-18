import { UserTableClass } from "back/special-table/userTable";
import { Model, ModelCtor } from "sequelize";
import { errorHandling } from "../../_helpers/fn";
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

    if (routeInfo.fileReturnWithHost === undefined)
      routeInfo.fileReturnWithHost = true

    if (this.uploads) {
      this.files = this.fileList()

      server.put(path, this.checkToken(routeInfo), this.uploads.fields(this.files), this.dataToBody(), (req: any, res: any) => {
        this.toDo(req, res)
      })
    } else {
      server.put(path, this.checkToken(routeInfo), (req: any, res: any) => {
        this.toDo(req, res)
      })
    }
  }

  protected toDo(req: any, res: any): any {
    try {
      if (!this.routeInfo.doSomething)
        return this.gestPutRoute(req, res, this.routeInfo)
      else {
        return this.routeInfo.doSomething(req, res, this)
      }
    } catch (err) {
      console.error(err)
      res.status(500).send(err);
    }
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
          toReturn[key] = this.setValue(req.body[key], value, false, data.get(key))
        }
      })

      return data.update(toReturn).then(updatedObject => {

        let toSend = updatedObject.get()

        if (route.returnColumns && toSend)
          toSend = this.list(toSend, route.returnColumns)
        this.getAllValue(toSend)
        if (route.beforeSend)
          route.beforeSend(req, res, this, toSend)
        if (this.uploads && this.routeInfo.fileReturnWithHost && this.files) {
          this.files.forEach((element) => {
            if (toSend.hasOwnProperty(element.name) && toSend[element.name]) {
              toSend[element.name] = req.protocol + '://' + req.headers.host + toSend[element.name]
            }
          })
        }
        return res.status(200).json(toSend)

      }).catch(err => {
        return errorHandling(err, res)
      })
    }).catch(err => {
      return errorHandling(err, res)
    })
  }
}