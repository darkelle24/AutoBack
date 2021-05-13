import { DataType, Table } from './models';
import { basicRouteParams, Route, RouteBasic } from './routeModels';

export let userTableDefine: Table = {
  id: { type: DataType.BIGINT, primaryKey: true, autoIncrement: true },
  username: { type: DataType.STRING, unique: true },
  password: { type: DataType.STRING },
  email: { type: DataType.STRING },
  phone: { type: DataType.STRING, allowNull: true },
  role: {type: DataType.STRING}
}

export interface access {
  /**
     * If undefined accept all
  */
  role?: string[],
  inverse?: boolean
}

export let basicRole: string[] = [
  "SuperAdmin",
  "Admin",
  "User"
]

export interface userTableConfig {
  readonly tokenSecret?: string,
  readonly passwordSecret?: string,
  expiresIn?: string,
  roles?: string[]
}

export interface realUserTableConfig {
  readonly tokenSecret: string,
  readonly passwordSecret: string,
  expiresIn: string,
  readonly roles: string[]
}

export interface authConfigAutoBack {
  config?: userTableConfig,
  getRoute?: basicRouteParams,
  postRoute?: basicRouteParams,
  putRoute?: basicRouteParams,
  deleteRoute?: basicRouteParams
}
