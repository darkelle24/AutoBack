import { UserTableClass } from './special-table/userTable';
import { RoutePostClass } from './route/routePost';
import { allRoutes, RouteDelete, RoutePut, RouteGet, RoutePost, RouteClass, InfoPlace } from './../_helpers/models/routeModels';
import { Model, ModelCtor } from "sequelize";
import { saveTable } from "../_helpers/models/models";
import { Route, TypeRoute } from "../_helpers/models/routeModels";
import { activeAllFiltersForAllCols, addPath } from '../_helpers/fn';
import { RouteGetClass } from './route/routeGet';
import { RoutePutClass } from './route/routePut';
import { RouteDeleteClass } from './route/routeDelete';

export class TableClass<M extends Model> {
  readonly name: string
  sequelizeData: ModelCtor<M>
  table: saveTable
  private server: any
  routes: allRoutes = { originRoutePath: '/', get: [], post: [], put: [], delete: [] }
  activeBasicRouting: boolean = false

  constructor(name: string, table: saveTable, sequelizeData: ModelCtor<M>, server: any, originRoutePath?: string, userTable?: UserTableClass<any>) {
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

  protected basicGet() {
    this.addRoute({
      path: '/',
      type: TypeRoute.GET,
      filters: activeAllFiltersForAllCols(this.table),
      limit: {},
      offset: {}
    })
  }

  protected basicPost() {
    this.addRoute({
      path: '/',
      type: TypeRoute.POST
    })
  }

  protected basicDelete() {
    this.addRoute({
      path: '/:id',
      type: TypeRoute.DELETE,
      filters: {
        id: {
          equal: {
            name: 'id',
            where: InfoPlace.PARAMS,
            transformValue: (value: string) => {return parseInt(value)}
          }
        }
      }
    })
  }

  protected basicPut() {
    this.addRoute({
      path: '/:id',
      type: TypeRoute.PUT,
      filters: {
        id: {
          equal: {
            name: 'id',
            where: InfoPlace.PARAMS,
            transformValue: (value: string) => {return parseInt(value)}
          }
        }
      }
    })
  }

  addRoute(route: Route): RouteClass | undefined {
    switch (route.type) {
      case TypeRoute.POST: {
        let routeClass = new RoutePostClass(this.table, this.sequelizeData, this.server, addPath(this.routes.originRoutePath, route.path), (route as RoutePost))
        this.routes.post.push(routeClass)
        return routeClass
      }
      case TypeRoute.GET: {
        let routeClass = new RouteGetClass(this.table, this.sequelizeData, this.server, addPath(this.routes.originRoutePath, route.path), (route as RouteGet))
        this.routes.get.push(routeClass)
        return routeClass
      }
      case TypeRoute.PUT: {
        let routeClass = new RoutePutClass(this.table, this.sequelizeData, this.server, addPath(this.routes.originRoutePath, route.path), (route as RoutePut))
        this.routes.put.push(routeClass)
        return routeClass
      }
      case TypeRoute.DELETE: {
        let routeClass = new RouteDeleteClass(this.table, this.sequelizeData, this.server, addPath(this.routes.originRoutePath, route.path), (route as RouteDelete))
        this.routes.delete.push(routeClass)
        return routeClass
      }
      default: {
        return undefined
      }
    }
  }
}