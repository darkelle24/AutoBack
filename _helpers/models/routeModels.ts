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
   filters?: ListFilter,
   /**
     * All columns value are selected with the same name in the body
  */
   dataAs?: ListValueInfo
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
   readonly type: TypeRoute.GET,
   limit?: FilterInfo,
   offset?: FilterInfo,
   columsAccept?: undefined,
   returnColumns?: acceptData,
   dataAs?: undefined,
   beforeSend?(request: any, respond: any, routeClass: RouteGetClass<any>, datas: any[]): void,
} & RouteBasic

export type RoutePost = {
  readonly type: TypeRoute.POST,
   returnColumns?: acceptData,
   beforeSetValue?(request: any, respond: any, routeClass: RoutePostClass<any>): void,
   beforeSend?(request: any, respond: any, routeClass: RoutePostClass<any>, data: any): void,
   filters?: undefined
} & RouteBasic

export type RoutePut = {
  readonly type: TypeRoute.PUT,
   returnColumns?: acceptData,
   beforeSetValue?(request: any, respond: any, routeClass: RoutePutClass<any>): void,
   beforeSend?(request: any, respond: any, routeClass: RoutePutClass<any>, data: any): void,
} & RouteBasic

export type RouteDelete = {
  readonly type: TypeRoute.DELETE,
   columsAccept?: undefined,
   dataAs?: undefined,
   beforeDelete?(request: any, respond: any, routeClass: RouteDeleteClass<any>): void
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
  equal?: FilterInfo,
  /**
     * Check if this filter operator is available for this columns type's
  */
  negatif?: FilterInfo,
  /**
     * Check if this filter operator is available for this columns type's
  */
  is?: FilterInfo,
  /**
     * Check if this filter operator is available for this columns type's
  */
  not?: FilterInfo,

  /**
     * Check if this filter operator is available for this columns type's
  */
  greater_than?: FilterInfo,
  /**
     * Check if this filter operator is available for this columns type's
  */
  greater_than_equals?: FilterInfo,
  /**
     * Check if this filter operator is available for this columns type's
  */
  smaller_than?: FilterInfo,
  /**
     * Check if this filter operator is available for this columns type's
  */
  smaller_than_equals?: FilterInfo,

  /**
     * Check if this filter operator is available for this columns type's
  */
  substring?: FilterInfo,
  /**
     * Check if this filter operator is available for this columns type's
  */
  regexp?: FilterInfo,
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
     *
     * Default value InfoPlace.QUERYPARAMS
  */
   where?: InfoPlace,
   /**
    * Replace transform with transform from dataTypeInfo if transformValue === undefined && dataTypeInfo.transform !== undefined
    */
   transformValue?(value: any): any
}

export interface RealListFilter {
   [columnsName: string]: RealListFilterInfo
}

export interface RealListFilterInfo {
   [infoName: string]: RealFilterInfo
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
  BODY = 0,
  PARAMS = 1,
  QUERYPARAMS = 2,
  HEADER = 3
}

export interface ListValueInfo {
   [columnsName: string]: ValueInfo
}

export interface ValueInfo {
   /**
      * Name to search
      *
      * Default value columns name
   */
   name?: string
   /**
      * The place to find the info of the filter
      *
      * You have the choice between InfoPlace.BODY, InfoPlace.PARAMS, InfoPlace.QUERYPARAMS, InfoPlace.HEADER
      *
      * Default value InfoPlace.BODY
   */
    where?: InfoPlace,
    /**
     * Replace transform with transform from dataTypeInfo if transformValue === undefined && dataTypeInfo.transform !== undefined
     */
   transformValue?(value: any): any,
    /**
    * Default value true
    *
    * If a properties in body have the same name and is not undefined or null they will replace
    */
   force?: boolean
 }

 export interface RealListValueInfo {
    [columnsName: string]: RealValueInfo
 }

 export interface RealValueInfo {
    name: string,
    where: InfoPlace,
    transformValue?(value: any): any,
    force: boolean
 }