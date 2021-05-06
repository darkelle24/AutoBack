import { allRoutes, RouteDelete, RoutePut, RouteGet, RoutePost, RouteBasic, acceptData } from './../_helpers/models/routeModels';
import { StatusCodes } from "http-status-codes";
import { Model, ModelCtor } from "sequelize";
import { saveDataTableInfo, saveTable } from "../_helpers/models/models";
import { Route, TypeRoute } from "../_helpers/models/routeModels";
import { addPath } from '../_helpers/fn';

export class TableClass<M extends Model> {
  readonly name: string
  sequelizeData: ModelCtor<M>
  table: saveTable
  private server: any
  routes: allRoutes = { originRoutePath: '/', get: [], post: [], put: [], delete: [] }
  activeBasicRouting: boolean = false

  constructor(name: string, table: saveTable, sequelizeData: ModelCtor<M>, server: any, originRoutePath?: string) {
    this.sequelizeData = sequelizeData
    this.table = table
    this.name = name
    this.server = server
    if (originRoutePath)
      this.routes.originRoutePath = addPath('', originRoutePath)
    else
      this.routes.originRoutePath = '/' + name
  }

  basicRouting(getRoute: boolean = true, postRoute: boolean = true, putRoute: boolean = true, deleteRoute: boolean = true) {
    if (!this.activeBasicRouting) {
      this.activeBasicRouting = true
      if (getRoute)
        this.basicGet()
      if (postRoute)
        this.basicPost()
      if (putRoute)
        this.basicPut()
      if (deleteRoute)
        this.basicDelete()
    } else {
      console.error('Already activate basic routing on table ' + this.name)
    }
  }

  private basicGet() {
    this.addRoute({
      path: '/',
      type: TypeRoute.GET
    })
  }

  private basicPost() {
    this.addRoute({
      path: '/',
      type: TypeRoute.POST
    })
  }

  private basicDelete() {
    this.addRoute({
      path: '/:id',
      type: TypeRoute.DELETE
    })
  }

  private basicPut() {
    this.addRoute({
      path: '/:id',
      type: TypeRoute.PUT
    })
  }

  setValue(value: any, info: saveDataTableInfo, created: boolean = true, olderValue?: any): any {
    let toReturn: any

    if (value !== undefined && value !== null) {
      toReturn = value
      if (info.type.JsonToDB)
        toReturn = info.type.JsonToDB(toReturn)
    } else if (created === false && olderValue !== undefined && olderValue !== null && info.allowNull.keepOldValue) {
      toReturn = olderValue
    } else if (info.defaultValue !== undefined) {
      toReturn = info.defaultValue
      if (info.type.JsonToDB)
        toReturn = info.type.JsonToDB(toReturn)
    } else {
      toReturn = null
    }
    return toReturn
  }

  getValue(value: any, info: saveDataTableInfo): any {
    if (info.type.DBToJson) {
      return info.type.DBToJson(value)
    }
    return value
  }

  getAllValue(data: any) {
    Object.entries(this.table).forEach(([key, value]) => {
      data[key] = this.getValue(data[key], value)
    })
  }

  addRoute(route: Route) {
    switch (route.type) {
      case TypeRoute.POST: {
        this.routes.post.push((route as RoutePost))
        this.server.post(addPath(this.routes.originRoutePath, route.path), (req: any, res: any) => {
          return this.gestPostRoute(req, res, (route as RoutePost))
        })
      }
      case TypeRoute.GET: {
        this.routes.get.push((route as RouteGet))
        this.server.get(addPath(this.routes.originRoutePath, route.path), (req: any, res: any) => {
          return this.gestGetRoute(req, res, (route as RouteGet))
        })
      }
      case TypeRoute.PUT: {
        this.routes.put.push((route as RoutePut))
        this.server.put(addPath(this.routes.originRoutePath, route.path), (req: any, res: any) => {
          return this.gestPutRoute(req, res, (route as RoutePut))
        })
      }
      case TypeRoute.DELETE: {
        this.routes.delete.push((route as RouteDelete))
        this.server.delete(addPath(this.routes.originRoutePath, route.path), (req: any, res: any) => {
          return this.gestDeleteRoute(req, res, (route as RouteDelete))
        })
      }
      default: {
        break;
      }
    }
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

  private gestGetRoute(req: any, res: any, route: RouteGet): any {

    return this.sequelizeData.findAll().then(datas => {
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

  private gestPostRoute(req: any, res: any, route: RoutePost): any {
    let toReturn: any = {}
    let body: any = req.body

    if (route.columsAccept && req.body)
      body = this.list(req.body, route.columsAccept)
    Object.entries(this.table).forEach(([key, value]) => {
      if (value.primaryKey === false) {
        toReturn[key] = this.setValue(body[key], value)
      }
    })

    return this.sequelizeData.create(
      toReturn
    ).then(data => {
      data = data.get()
      if (route.returnColumns && data)
        data = this.list(data, route.returnColumns)
      return res.status(200).json(data)
    })
  }

  private gestDeleteRoute(req: any, res: any, route: RouteDelete): any {
    return this.sequelizeData.findOne({ where: { id: req.params.id } }).then(data => {
      if (!data) {
        return res.status(404).json({ message: "Treatment " + req.params.id + " not found" })
      }

      return (data.destroy().then(() => {
        return res.status(200).json({
            message: this.name + " deleted"
        })
      }))
    })
  }

  private list(data: any, accept: acceptData): any {
    if (accept.inverse)
      return this.blackList(data, accept)
    return this.whiteList(data, accept)
  }

  private blackList(data: any, accept: acceptData): any {
    if (accept.whitelist && accept.whitelist.length !== 0) {
      let toReturn: any = data
      let list: string[] = accept.whitelist

      Object.entries(data).forEach(([key, value]) => {
        if (list.find(element => element === key))
          delete toReturn[key]
      })
      return toReturn
    } else if (accept.whitelist !== undefined && (accept.whitelist === null || accept.whitelist.length === 0)) {
      return data
    } else if (accept.whitelist === undefined) {
      return {}
    }
  }

  private whiteList(data: any, accept: acceptData): any {
    if (accept.whitelist && accept.whitelist.length !== 0) {
      let toReturn: any = {}
      let list: string[] = accept.whitelist

      Object.entries(data).forEach(([key, value]) => {
        if (list.find(element => element === key))
          toReturn[key] = value
      })
      return toReturn
    } else if (accept.whitelist !== undefined && (accept.whitelist === null || accept.whitelist.length === 0)) {
      return {}
    } else if (accept.whitelist === undefined) {
      return data
    }
  }
}