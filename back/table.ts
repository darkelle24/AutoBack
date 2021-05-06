import { allRoutes } from './../_helpers/models/routeModels';
import { StatusCodes } from "http-status-codes";
import { Model, ModelCtor } from "sequelize";
import { saveTable } from "../_helpers/models/models";
import { Route, TypeRoute } from "../_helpers/models/routeModels";
import { addPath } from '../_helpers/fn';

export class TableClass<M extends Model> {
  readonly name: string
  sequelizeData: ModelCtor<M>
  table: saveTable
  private server: any
  routes: allRoutes = {originRoutePath: '/', get: [], post: [], put: [], delete: []}
  activeBasicRouting: boolean = false

  constructor(name: string, table: saveTable, sequelizeData: ModelCtor<M>, server: any, originRoutePath?: string) {
    this.sequelizeData = sequelizeData
    this.table = table
    this.name = name
    this.server = server
    if (originRoutePath)
      this.routes.originRoutePath = addPath('', originRoutePath)
    else
      this.routes.originRoutePath = '/'+ name
  }

  basicRouting() {
    if (!this.activeBasicRouting) {
      this.activeBasicRouting = true
      this.basicGet()
      this.basicPost()
      this.basicPut()
      this.basicDelete()
    } else {
      console.error('Already activate basic routing on table ' + this.name)
    }
  }

  basicGet() {
    this.addRoute({
      path: '/',
      type: TypeRoute.GET
    })
  }

  basicPost() {
    this.addRoute({
      path: '/',
      type: TypeRoute.POST
    })
  }

  basicDelete() {
    this.addRoute({
      path: '/:id',
      type: TypeRoute.DELETE
    })
  }

  basicPut() {
    this.addRoute({
      path: '/:id',
      type: TypeRoute.PUT
    })
  }

  addRoute(route: Route) {
    switch (route.type) {
      case TypeRoute.POST: {
        this.routes.post.push(route)
        this.server.post(addPath(this.routes.originRoutePath, route.path), (req: any, res: any) => {
          let toReturn: any = {}
          Object.keys(this.table).forEach((key) => {
            toReturn[key] = req.body[key]
          })

          return this.sequelizeData.create(
            toReturn
          ).then(data => {
            return res.status(200).json(data)
          })
        })
      }
      case TypeRoute.GET: {
        this.routes.get.push(route)
        this.server.get(addPath(this.routes.originRoutePath, route.path), (req: any, res: any) => {
          return this.sequelizeData.findAll().then(datas => {
            return res.status(StatusCodes.OK).json(datas)
          })
        })
      }
      case TypeRoute.PUT: {
        this.routes.put.push(route)
        this.server.put(addPath(this.routes.originRoutePath, route.path), (req: any, res: any) => {
          res.status(StatusCodes.OK).json({message: "OK"})
        })
      }
      case TypeRoute.DELETE: {
        this.routes.delete.push(route)
        this.server.delete(addPath(this.routes.originRoutePath, route.path), (req: any, res: any) => {
          res.status(StatusCodes.OK).json({message: "OK"})
        })
      }
      default: {
        break;
      }
   }
  }
}