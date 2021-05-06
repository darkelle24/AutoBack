export enum TypeRoute {
  GET,
  POST,
  PUT,
  DELETE
}

export interface allRoutes {
  originRoutePath: string,
  get: Route[],
  post: Route[],
  put: Route[],
  delete: Route[]
}

export interface Route {
  path: string,
  type: TypeRoute,
  /**
     * If columsAccept undefined accept all columns execpt primaryKey
     * 
     * If columsAccept null accept no columns
  */
  columsAccept?: string[] | null
}