import { UserTableClass } from './special-table/userTable';
import { RoutePostClass } from './route/routePost';
import { allRoutes, RouteDelete, RoutePut, RouteGet, RoutePost, RouteClass, InfoPlace, basicRouteParams } from './../_helpers/models/routeModels';
import { Model, ModelCtor } from "sequelize";
import { DataType, saveTable } from "../_helpers/models/models";
import { Route, TypeRoute } from "../_helpers/models/routeModels";
import { activeAllFiltersForAllCols, addPath, getFileExtansion } from '../_helpers/fn';
import { RouteGetClass } from './route/routeGet';
import { RoutePutClass } from './route/routePut';
import { RouteDeleteClass } from './route/routeDelete';
import { access } from '_helpers/models/userTableModel';
import multer from 'multer'
import fs from 'fs'
import path from 'path';

export class TableClass<M extends Model> {
  readonly name: string
  sequelizeData: ModelCtor<M>
  table: saveTable
  private server: any
  routes: allRoutes = { originRoutePath: '/', get: [], post: [], put: [], delete: [] }
  activeBasicRouting: boolean = false
  private userTable?: UserTableClass<any> = undefined
  readonly upload?: multer.Multer
  readonly pathFolder?: string

  constructor(name: string, table: saveTable, sequelizeData: ModelCtor<M>, server: any, filePath: string, originServerPath: string, originRoutePath?: string, userTable?: UserTableClass<any>) {
    this.sequelizeData = sequelizeData
    this.table = table
    this.name = name
    this.server = server
    this.userTable = userTable
    if (originRoutePath)
      this.routes.originRoutePath = addPath('/', addPath(originServerPath, originRoutePath))
    else
      this.routes.originRoutePath = addPath('/', addPath(addPath(originServerPath, '/'), name))

    let haveFile = Object.values(this.table).some((value: any) => { return value.type.autobackDataType === DataType.FILE })

    if (haveFile) {
      let pathFolder = path.join(filePath, name)

      let storage = multer.diskStorage({
        destination: function (req, file, cb) {
          if (!fs.existsSync(path.join(pathFolder, file.fieldname))){
            fs.mkdirSync(path.join(pathFolder, file.fieldname), { recursive: true });
          }
          cb(null, path.join(pathFolder, file.fieldname))
        },
        filename: function (req, file, cb) {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) + '-' + file.fieldname
          const ext = getFileExtansion(file.originalname)

          if (!ext)
            cb(null, uniqueSuffix)
          else
            cb(null, uniqueSuffix + ext)
        }
      })

      this.upload = multer({
        storage: storage
      });
      this.pathFolder = pathFolder
    }
  }

  basicRouting(getRoute: basicRouteParams = {}, postRoute: basicRouteParams = {}, putRoute: basicRouteParams = {}, deleteRoute: basicRouteParams = {}) {
    if (!this.activeBasicRouting) {
      this.activeBasicRouting = true
      if (getRoute && (getRoute.active || getRoute.active === undefined))
        this.basicGet(getRoute.auth)
      if (postRoute && (postRoute.active || postRoute.active === undefined))
        this.basicPost(postRoute.auth)
      if (putRoute && (putRoute.active || putRoute.active === undefined))
        this.basicPut(putRoute.auth)
      if (deleteRoute && (deleteRoute.active || deleteRoute.active === undefined))
        this.basicDelete(deleteRoute.auth)
    } else {
      console.error('Already activate basic routing on table ' + this.name)
    }
  }

  protected basicGet(accessRule?: access) {
    this.addRoute({
      path: '/',
      type: TypeRoute.GET,
      filters: activeAllFiltersForAllCols(this.table),
      limit: {},
      offset: {},
      auth: accessRule
    })
  }

  protected basicPost(accessRule?: access) {
    this.addRoute({
      path: '/',
      type: TypeRoute.POST,
      auth: accessRule
    })
  }

  protected basicDelete(accessRule?: access) {
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
      },
      auth: accessRule
    })
  }

  protected basicPut(accessRule?: access) {
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
      },
      auth: accessRule
    })
  }

  addRoute(route: Route): RouteClass | undefined {
    switch (route.type) {
      case TypeRoute.POST: {
        let routeClass = new RoutePostClass({ table: this.table, uploads: this.upload, pathFolder: this.pathFolder}, this.sequelizeData, this.server, addPath(this.routes.originRoutePath, route.path), (route as RoutePost), this.userTable)
        this.routes.post.push(routeClass)
        return routeClass
      }
      case TypeRoute.GET: {
        let routeClass = new RouteGetClass({ table: this.table, uploads: this.upload, pathFolder: this.pathFolder}, this.sequelizeData, this.server, addPath(this.routes.originRoutePath, route.path), (route as RouteGet), this.userTable)
        this.routes.get.push(routeClass)
        return routeClass
      }
      case TypeRoute.PUT: {
        let routeClass = new RoutePutClass({ table: this.table, uploads: this.upload, pathFolder: this.pathFolder}, this.sequelizeData, this.server, addPath(this.routes.originRoutePath, route.path), (route as RoutePut), this.userTable)
        this.routes.put.push(routeClass)
        return routeClass
      }
      case TypeRoute.DELETE: {
        let routeClass = new RouteDeleteClass({ table: this.table, uploads: this.upload, pathFolder: this.pathFolder}, this.sequelizeData, this.server, addPath(this.routes.originRoutePath, route.path), (route as RouteDelete), this.userTable)
        this.routes.delete.push(routeClass)
        return routeClass
      }
      default: {
        return undefined
      }
    }
  }
}