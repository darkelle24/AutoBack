import { RoutePostClass } from './../../back/route/routePost';
import { RouteGetClass } from './../../back/route/routeGet';
import { RouteDeleteClass } from '../../back/route/routeDelete';
import { RoutePutClass } from '../../back/route/routePut';

export enum TypeRoute {
  GET,
  POST,
  PUT,
  DELETE
}

export interface allRoutes {
  originRoutePath: string,
  get: RouteGetClass<any>[],
  post: RoutePostClass<any>[],
  put: RoutePutClass<any>[],
  delete: RouteDeleteClass<any>[]
}

export interface RouteBasic {
  path: string,
  /**
     * If columsAccept undefined accept all columns execpt primaryKey
  */
  columsAccept?: acceptData,
  filters?: ListFilter
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

export type RouteClass = RouteGetClass<any> | RoutePostClass<any> | RoutePutClass<any> | RouteDeleteClass<any>

export interface ListFilter {
  [columnsName: string]: FilterOperators
}

export interface FilterOperators {
  /**
     * Check if this filter operator is available for this columns type's
  */
  equal: FilterInfo,
  /**
     * Check if this filter operator is available for this columns type's
  */
  negatif: FilterInfo,
  /**
     * Check if this filter operator is available for this columns type's
  */
  is: FilterInfo,
  /**
     * Check if this filter operator is available for this columns type's
  */
  not: FilterInfo,

  /**
     * Check if this filter operator is available for this columns type's
  */
  greater_than: FilterInfo,
  /**
     * Check if this filter operator is available for this columns type's
  */
  greater_than_equals: FilterInfo,
  /**
     * Check if this filter operator is available for this columns type's
  */
  smaller_than: FilterInfo,
  /**
     * Check if this filter operator is available for this columns type's
  */
  smaller_than_equals: FilterInfo,

  /**
     * Check if this filter operator is available for this columns type's
  */
  substring: FilterInfo,
  /**
     * Check if this filter operator is available for this columns type's
  */
  regexp: FilterInfo,
}

export interface FilterInfo {
  /**
     * Default name is name of columns + "_" + name of the filter operator
  */
  name?: string
  /**
     * The place to find the info of the filter
     *
     * You have the choice between InfoPlace.BODY, InfoPlace.PARAMS, InfoPlace.QUERYPARAMS, InfoPlace.HEADER
  */
   where: InfoPlace,
   transformValue?(value: any): any
}

export interface RealFilterInfo {
   info: FilterInfoType
   name: string
   where: InfoPlace,
   transformValue?(value: any): any
}

export interface FilterInfoType {
   name: string,
   reduce_name: string,
   sequilize_type: any
}

export enum InfoPlace {
  BODY,
  PARAMS,
  QUERYPARAMS,
  HEADER
}