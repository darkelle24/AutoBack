import { ListFilter, Route } from './../../_helpers/models/routeModels';
import { basicRole, userTableConfig, realUserTableConfig, access } from './../../_helpers/models/userTableModel';
import { Model, ModelCtor } from 'sequelize';
import { activeAllFiltersForAllCols } from '../../_helpers/fn';
import { basicRouteParams, InfoPlace, TypeRoute } from '../../_helpers/models/routeModels';
import { TableClass } from '../table';
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import _ from 'lodash';
import { saveTable } from '../../_helpers/models/modelsTable';
import express from 'express';


export class UserTableClass<M extends Model> extends TableClass<M> {

  readonly config: realUserTableConfig

  constructor(auth: userTableConfig, name: string, table: saveTable, sequelizeData: ModelCtor<M>, server: express.Application, filePath: string, originServerPath: string, originRoutePath?: string) {
    if (table.role.validate) {
      table.role.validate.equals = { comparaison: auth.roles ? auth.roles : basicRole, msg: "Role don't exist" }
    }
    if (table.password.validate && table.password.validate.isStrongPassword) {
      if (table.password.validate.isStrongPassword === true)
        table.password.validate.isStrongPassword = {}
      table.password.validate.isStrongPassword = _.merge({minLength: 6, minLowercase: 1, minUppercase: 0, minNumbers: 0, minSymbols: 0, maxLength: 15}, table.password.validate.isStrongPassword)
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      table.password.validate.isStrongPassword.msg = "Wrong password need to have: min length: " + table.password.validate.isStrongPassword.minLength.toString() + ", max length: " + table.password.validate.isStrongPassword.maxLength.toString() + ", min lowercase: " + table.password.validate.isStrongPassword.minLowercase.toString() + ", min uppercase: " + table.password.validate.isStrongPassword.minUppercase.toString() + ", min numbers: " + table.password.validate.isStrongPassword.minNumbers.toString() + ", min symbols: " + table.password.validate.isStrongPassword.minSymbols.toString()
    }
    super(name, table, sequelizeData, server, filePath, originServerPath, originRoutePath)
    this.config = {
      tokenSecret: auth.tokenSecret ? auth.tokenSecret : "wVmNfh6YPJMHtwtbj0Wa43wSh3cvJpoKqoQzZK8QbwjTGEVBNYO8xllNQC2G0U7lfKcVMK5lsn1Tshwl",
      passwordSecret: auth.passwordSecret ? auth.passwordSecret : "pBvhLoQrwTKyk9amfwSabc0zwh5EuV7DDTYpbGG4K52vV9WGftSDhmlz90hMvASJlHk1azg24Uvdturqomx819kz10NS9S",
      expiresIn: auth.expiresIn && auth.expiresIn !== "" ? auth.expiresIn : "7 days",
      roles: auth.roles ? auth.roles : basicRole,
      basicUser: auth.basicUser
    }
  }

  basicRouting(getRoute: basicRouteParams = {}, postRoute: basicRouteParams = {}, putRoute: basicRouteParams = {}, deleteRoute: basicRouteParams = {}): void {
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
      this.login()
    } else {
      console.error('Already activate basic routing on table ' + this.name)
    }
  }

  protected filterAllWithoutPassword(): ListFilter {
    const toReturn = activeAllFiltersForAllCols(this.table);
    delete toReturn.password;
    return toReturn
  }

  protected basicGet(accessRule?: access):void {
    super.addRoute({
      path: '/',
      type: TypeRoute.GET,
      filters: this.filterAllWithoutPassword(),
      limit: {},
      offset: {},
      returnColumns: {
        list: ['password'],
        inverse: true
      },
      auth: accessRule
    })
  }

  protected basicDelete(accessRule?: access):void {
    super.addRoute({
      path: '/:user_id',
      type: TypeRoute.DELETE,
      filters: {
        id: {
          equal: {
            name: 'user_id',
            where: InfoPlace.PARAMS,
            transformValue: (value: string) => {return parseInt(value)}
          }
        }
      },
      auth: accessRule
    })
  }

  protected basicPut(accessRule?: access): void {
    super.addRoute({
      path: '/:user_id',
      type: TypeRoute.PUT,
      filters: {
        id: {
          equal: {
            name: 'user_id',
            where: InfoPlace.PARAMS,
            transformValue: (value: string) => { return parseInt(value) }
          }
        }
      },
      returnColumns: {
        list: ['password'],
        inverse: true
      },
      auth: accessRule
    })
  }

  protected basicPost(accessRule?: access): void {
    super.addRoute({
      path: '/register',
      type: TypeRoute.POST,
      returnColumns: {
        list: ["password"],
        inverse: true
      },
      auth: accessRule
    })
  }

  public getHash(): crypto.Hmac {
    return crypto.createHmac('sha512', this.config.passwordSecret)
  }

  protected login(): void {
    super.addRoute({
      path: '/login',
      type: TypeRoute.POST,
      doSomething: async (req, res, route) => {
        const { username, password } = req.body;

        const user = await route.sequelizeData.findOne({ where: { username: username, password: this.getHash().update(password).digest('hex') } })

        if (user) {
          const temp = user.get()
          delete temp.password
          const accessToken = jwt.sign(temp, this.config.tokenSecret, {expiresIn: this.config.expiresIn});

          res.json({
            ...temp,
            ...{ token: accessToken }
          });
        } else {
          res.status(401).json({ message: 'Username or password incorrect' });
          res.statusMessage = 'Username or password incorrect'
        }
      }
    })
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  protected checkJWT(token: string, req: any, res: express.Response): boolean  {
    let good: boolean = false

    jwt.verify(token, this.config.tokenSecret, (err: any, user: any) => {
      if (err) {
        good = false
        res.status(403).json({ message: err.toString() });
        res.statusMessage = err.toString()
        return res
      }
      req.user = user;
      good = true
    });

    return good
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  protected async checkUserExist(req: any, res: express.Response, sequilize: ModelCtor<any>): Promise<boolean> {
    const user = await sequilize.findOne({ where: { id: req.user.id, createdAt: req.user.createdAt } })

    if (user) {
      req.user = user.get()
      return true
    }
    res.status(403).json({ message: "The user does not exist" });
    res.statusMessage = "The user does not exist"
    return false
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  protected checkRole(req: any, res: express.Response, route: Route): boolean {
    if (route.auth && route.auth.role) {
      const find = route.auth.role.find(e => e === req.user.role)
      let toReturn: boolean = false

      if (find)
        toReturn = true

      if (route.auth.inverse)
        toReturn = !toReturn
      if (!toReturn) {
        res.status(403).json({ message: "You don't have right to access this route" });
        res.statusMessage = "You don't have right to access this route"
      }
      return toReturn
    }
    return true
  }

  public async checkToken(req: express.Request, res: express.Response, route: Route): Promise<boolean>{
    if (route.auth) {
      const authHeader = req.headers.authorization;

      if (authHeader) {
        const token = authHeader.split(' ')[1];
        if (!this.checkJWT(token, req, res))
          return false
        const result = await this.checkUserExist(req, res, this.sequelizeData)
        if (!result)
          return false
        if (!this.checkRole(req, res, route))
          return false
      } else {
        res.status(401).json({ message: 'Need to be auth to access this route' })
        res.statusMessage = 'Need to be auth to access this route'
        return false
      }
    }
    return true
  }
}