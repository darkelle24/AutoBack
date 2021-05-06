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

export interface RouteBasic {
  path: string,
  /**
     * If columsAccept undefined accept all columns execpt primaryKey
  */
  columsAccept?: acceptData
}

export interface acceptData {
    /**
     * If whitelist undefined accept all columns execpt primaryKey
     *
     * If whitelist null accept no columns
    */
    whitelist?: string[] | null,
    /**
     * If inverse is true whitelist became blacklist
    */
    inverse?: boolean
}

export type RouteGet = {
  readonly type: TypeRoute.GET
} & RouteBasic

export type RoutePost = {
  readonly type: TypeRoute.POST,
  returnColumns?: acceptData
} & RouteBasic

export type RoutePut = {
  readonly type: TypeRoute.PUT,
  returnColumns?: acceptData
} & RouteBasic

export type RouteDelete = {
  readonly type: TypeRoute.DELETE,
  columsAccept?: undefined
} & RouteBasic

export type Route = RouteGet | RoutePost | RoutePut | RouteDelete