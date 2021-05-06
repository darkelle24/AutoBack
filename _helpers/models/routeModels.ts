export enum TypeRoute {
  GET,
  POST,
  PUT,
  DELETE
}

export interface allRoutes {
  originRoutePath: string,
  get: RouteGet[],
  post: RoutePost[],
  put: RoutePut[],
  delete: RouteDelete[]
}

interface RouteBasic {
  path: string,
  /**
     * If columsAccept undefined accept all columns execpt primaryKey
     * 
     * If columsAccept null accept no columns
  */
  columsAccept?: string[] | null
}

export type RouteGet = {
  readonly type: TypeRoute.GET
} & RouteBasic

export type RoutePost = {
  readonly type: TypeRoute.POST
} & RouteBasic

export type RoutePut = {
  readonly type: TypeRoute.PUT,
} & RouteBasic

export type RouteDelete = {
  readonly type: TypeRoute.DELETE
} & RouteBasic

export type Route = RouteGet | RoutePost | RoutePut | RouteDelete