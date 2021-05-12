import { DataType, Table } from './models';
import { Route, RouteBasic } from './routeModels';

export let userTableDefine: Table = {
  id: { type: DataType.BIGINT, primaryKey: true, autoIncrement: true },
  username: { type: DataType.STRING },
  password: { type: DataType.STRING },
  email: { type: DataType.STRING },
  phone: { type: DataType.STRING },
  role: {type: DataType.STRING, defaultValue: "User"}
}

export interface access {
  /**
     * If undefined accept all
  */
  role?: string[],
  /**
     * Active every time and after role check and self check
  */
  detect?(req: any, route: Route): any
}

export let basicRole: string[] = [
  "SuperAdmin",
  "Admin",
  "User"
]
