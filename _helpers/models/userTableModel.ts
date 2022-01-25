import { UserTableClass } from 'back/special-table/userTable';
import { ABDataType } from './modelsType';
import { Table } from './modelsTable';
import { basicRouteParams } from './routeModels';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import nodemailer from "nodemailer"

export const userTableDefine: Table = {
  id: { type: ABDataType.BIGINT, primaryKey: true, autoIncrement: true },
  username: { type: ABDataType.STRING, unique: true },
  password: { type: ABDataType.STRING, neverShow: true, validate: { isStrongPassword: { minLength: 6, maxLength: 20, minLowercase: 1, minUppercase: 0, minNumbers: 1, minSymbols: 0 }}, transformSet: (value: string, table: UserTableClass<any>) => { return table.getHash().update(value).digest('hex') } },
  email: { type: ABDataType.STRING, validate: {isEmail: true}, unique: true },
  phone: { type: ABDataType.STRING, allowNull: true },
  role: {type: ABDataType.STRING, validate: { equals: {comparaison: ["Admin", "SuperAdmin"]}}}
}

export interface access {
  /**
     * If undefined accept all
  */
  role?: string[],
  inverse?: boolean
}

export const basicRole: string[] = [
  "SuperAdmin",
  "Admin",
  "User"
]

export interface userTableConfig {
  readonly tokenSecret?: string,
  readonly passwordSecret?: string,
  expiresIn?: string,
  roles?: string[],
  basicUser?: {
    [key: string]: any
  }
  /**
     * Non undefined will activate route to recup mdp
  */
  nameAccountMailRecupMDP?: string,
  accountMailRecupBodyText?(token: string, user: any): string,
  accountMailRecupBodyHTML?(token: string, user: any): string,
  accountMailRecupObject?(user: any): string,
}

export interface realUserTableConfig {
  readonly tokenSecret: string,
  readonly passwordSecret: string,
  expiresIn: string,
  readonly roles: string[],
  readonly basicUser?: {
    [key: string]: any
  },
  readonly accountMailRecupMDP?: nodemailer.Transporter<SMTPTransport.SentMessageInfo>,
  accountMailRecupBodyText(token: string, user: any): string,
  accountMailRecupBodyHTML?(token: string, user: any): string,
  accountMailRecupObject(user: any): string,
}

export interface authConfigAutoBack {
  config?: userTableConfig,
  getRoute?: basicRouteParams,
  postRoute?: basicRouteParams,
  putRoute?: basicRouteParams,
  deleteRoute?: basicRouteParams
}
