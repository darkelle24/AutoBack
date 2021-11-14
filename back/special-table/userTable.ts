import { ListFilter, Route } from './../../_helpers/models/routeModels';
import { basicRole, userTableConfig, realUserTableConfig, access } from './../../_helpers/models/userTableModel';
import { Model, ModelCtor } from 'sequelize';
import { activeAllFiltersForAllCols, errorHandling, loginPostmanAfterRequestEvent } from '../../_helpers/fn';
import { basicRouteParams, InfoPlace, TypeRoute } from '../../_helpers/models/routeModels';
import { TableClass } from '../table';
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import _ from 'lodash';
import { saveTable } from '../../_helpers/models/modelsTable';
import express from 'express';


export class UserTableClass<M extends Model> extends TableClass<M> {

  readonly config: realUserTableConfig
  readonly passwordEncode: (value: any, table: TableClass<any>) => any

  constructor(auth: userTableConfig, name: string, table: saveTable, server: express.Application, filePath: string, originServerPath: string, originRoutePath?: string) {
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
    super(name, table, server, filePath, originServerPath, originRoutePath, undefined, 'Table who contains all informations about user.')
    this.config = {
      tokenSecret: auth.tokenSecret ? auth.tokenSecret : "wVmNfh6YPJMHtwtbj0Wa43wSh3cvJpoKqoQzZK8QbwjTGEVBNYO8xllNQC2G0U7lfKcVMK5lsn1Tshwl",
      passwordSecret: auth.passwordSecret ? auth.passwordSecret : "pBvhLoQrwTKyk9amfwSabc0zwh5EuV7DDTYpbGG4K52vV9WGftSDhmlz90hMvASJlHk1azg24Uvdturqomx819kz10NS9S",
      expiresIn: auth.expiresIn && auth.expiresIn !== "" ? auth.expiresIn : "7 days",
      roles: auth.roles ? auth.roles : basicRole,
      basicUser: auth.basicUser
    }
    if (table.password && table.password.transformSet)
      this.passwordEncode = table.password.transformSet
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
      /* returnColumns: {
        list: ['password'],
        inverse: true
      }, */
      auth: accessRule,
      name: 'Get Users'
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
      auth: accessRule,
      name: 'Delete User'
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
      auth: accessRule,
      name: 'Put User'
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
      auth: accessRule,
      name: 'Register'
    })
  }

  public getHash(): crypto.Hmac {
    return crypto.createHmac('sha512', this.config.passwordSecret)
  }

  protected login(): void {
    super.addRoute({
      path: '/login',
      type: TypeRoute.POST,
      name: 'Login',
      event: {afterResponse: loginPostmanAfterRequestEvent(this.config.roles)},
      doSomething: async (req, res, route) => {
        if (!req.body['username'] || !req.body['password']) {
          return errorHandling(new Error('Missing a username or / and a password.'), res)
        }
        const { username, password } = req.body;

        const user = await route.sequelizeData.findOne({ where: { username: username, password: this.passwordEncode(password, this) } })

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
          return
        }
      }
    })
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  protected checkJWT(token: string): any | undefined  {
    let user: any = undefined

    jwt.verify(token, this.config.tokenSecret, (err: any, userJwt: any) => {
      if (err) {
        user = undefined
        throw Error(err.toString())
      }
      user = userJwt;
    });

    return user
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  protected async checkUserExist(userToCheck: any, sequilize: ModelCtor<any>): Promise<any> {
    const user = await sequilize.findOne({ where: { id: userToCheck.id, createdAt: userToCheck.createdAt } })

    if (user) {
      return user
    }
    throw Error ("The user does not exist")
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  protected checkRole(roleUser: string, role?: string[], inverse?: boolean): boolean {
    if (role) {
      if (inverse === undefined)
        inverse = false

      const find = role.find(e => e === roleUser)
      let toReturn: boolean = false

      if (find)
        toReturn = true

      if (inverse)
        toReturn = !toReturn
      if (!toReturn) {
        throw Error("You don't have right to access this route")
      }
      return toReturn
    }
    return true
  }

  public async checkToken(token: string, role?: string[], inverse?: boolean): Promise<any> {
    try {
        let user = this.checkJWT(token);
        user = await this.checkUserExist(user, this.sequelizeData);
        this.checkRole(user.role, role, inverse);
        return user;
    } catch (error) {
        throw error
    }
  }

  public async checkTokenExpress(req: express.Request, res: express.Response, route: Route): Promise<boolean>{
    if (route.auth) {
      const authHeader = req.headers.authorization;

      if (authHeader) {
        const token = authHeader.split(' ')[1];
        let good: boolean = true;

        (<any>req).user = await this.checkToken(token,
            route.auth && route.auth.role ? route.auth.role : undefined,
            route.auth && route.auth.inverse ? route.auth.inverse : undefined
          ).catch((err: any) =>{
            res.status(403).json({ message: err.toString() });
            res.statusMessage = err.toString()
            good = false
          })
        return good
      } else {
        res.status(401).json({ message: 'Need to be auth to access this route' })
        res.statusMessage = 'Need to be auth to access this route'
        return false
      }
    }
    return true
  }
}