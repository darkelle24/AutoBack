import { ListFilter, Route, RouteClass, acceptData } from './../../_helpers/models/routeModels';
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
import nodemailer from "nodemailer"
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { FileTableClass } from './fileTable';
import { AutoBackRouteError } from '../../_helpers/error';

export class UserTableClass<M extends Model> extends TableClass<M> {

  readonly config: realUserTableConfig
  readonly passwordEncode: (value: any, table: TableClass<any>) => any

  constructor(auth: userTableConfig, name: string, table: saveTable, server: express.Application, originServerPath: string, fileTable?: FileTableClass<any>, mailAccount?: nodemailer.Transporter<SMTPTransport.SentMessageInfo>, originRoutePath?: string) {
    if (table.role.validate) {
      table.role.validate.equals = { comparaison: auth.roles ? auth.roles : basicRole, msg: "Role don't exist" }
    }
    if (table.password.validate && table.password.validate.isStrongPassword) {
      if (table.password.validate.isStrongPassword === true)
        table.password.validate.isStrongPassword = {}
      table.password.validate.isStrongPassword = _.merge({ minLength: 6, minLowercase: 1, minUppercase: 0, minNumbers: 0, minSymbols: 0, maxLength: 15 }, table.password.validate.isStrongPassword)
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      table.password.validate.isStrongPassword.msg = "Wrong password need to have: min length: " + table.password.validate.isStrongPassword.minLength.toString() + ", max length: " + table.password.validate.isStrongPassword.maxLength.toString() + ", min lowercase: " + table.password.validate.isStrongPassword.minLowercase.toString() + ", min uppercase: " + table.password.validate.isStrongPassword.minUppercase.toString() + ", min numbers: " + table.password.validate.isStrongPassword.minNumbers.toString() + ", min symbols: " + table.password.validate.isStrongPassword.minSymbols.toString()
    }
    super(name, table, server, originServerPath, fileTable, originRoutePath, undefined, 'Table who contains all informations about user.')
    this.config = {
      tokenSecret: auth.tokenSecret ? auth.tokenSecret : "wVmNfh6YPJMHtwtbj0Wa43wSh3cvJpoKqoQzZK8QbwjTGEVBNYO8xllNQC2G0U7lfKcVMK5lsn1Tshwl",
      passwordSecret: auth.passwordSecret ? auth.passwordSecret : "pBvhLoQrwTKyk9amfwSabc0zwh5EuV7DDTYpbGG4K52vV9WGftSDhmlz90hMvASJlHk1azg24Uvdturqomx819kz10NS9S",
      expiresIn: auth.expiresIn && auth.expiresIn !== "" ? auth.expiresIn : "7 days",
      roles: auth.roles ? auth.roles : basicRole,
      basicUser: auth.basicUser,
      accountMailRecupMDP: mailAccount ? mailAccount : undefined,
      accountMailRecupBodyHTML: auth.accountMailRecupBodyHTML ? auth.accountMailRecupBodyHTML : undefined,
      accountMailRecupBodyText: auth.accountMailRecupBodyText ? auth.accountMailRecupBodyText : (token: string, user: any) => 'Token ' + token,
      accountMailRecupObject: auth.accountMailRecupObject ? auth.accountMailRecupObject : (user: any) => 'Recup Mail'
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
      this.routeCheckJWT()
      if (this.config.accountMailRecupMDP) {
        this.sendRecupMail()
        this.resetForgotPassword()
      }
    } else {
      console.error('Already activate basic routing on table ' + this.name)
    }
  }

  protected sendRecupMail(): void {
    super.addRoute({
      path: '/sendRecoverMail',
      type: TypeRoute.POST,
      name: 'Send an email to recover password',
      doSomething: async (req: any, res: any, route: RouteClass) => {
        if (!req.body['email']) {
          return errorHandling(new Error('Missing an email.'), res)
        }

        const user = await this.sequelizeData.findOne({ where: { email: req.body.email } })

        if (!user) {
          return errorHandling(Error("User not found"), res)
        }

        const token = jwt.sign({ email: req.body.email }, this.config.tokenSecret, { expiresIn: this.config.expiresIn })

        this.config.accountMailRecupMDP.sendMail({
          from: (<any>this.config.accountMailRecupMDP.transporter).auth.user,
          to: (<any>user).email,
          subject: this.config.accountMailRecupObject(user),
          text: !this.config.accountMailRecupBodyHTML ? this.config.accountMailRecupBodyText(token, user) : undefined,
          html: this.config.accountMailRecupBodyHTML ? this.config.accountMailRecupBodyHTML(token, user) : undefined,
        })
        res.status(200).json({ message: 'Mail send' });
      }
    })
  }

  protected resetForgotPassword(): void {
    super.addRoute({
      path: '/resetForgotPassword',
      type: TypeRoute.POST,
      name: 'Reset forgot password',
      doSomething: async (req, res, route) => {
        let user: any = undefined

        if (!req.body['token'] || !req.body['password']) {
          return errorHandling(new Error('Missing a token or / and a password.'), res)
        }

        try {
          jwt.verify(req.body['token'], this.config.tokenSecret, (err: any, userJwt: any) => {
            if (err) {
              user = undefined
              throw err
            }
            user = userJwt;
          });
        } catch (e: any) {
          if (e instanceof AutoBackRouteError) {
            return errorHandling(e.message, res, e.code)
          }
          return errorHandling(e.message, res)
        }

        if (!user) {
          return errorHandling('Wrong token', res)
        }

        user = await route.sequelizeData.findOne({ where: { email: user.email } })

        if (!user) {
          return errorHandling('Wrong token', res)
        }

        try {
          user.password = req.body.password
          await user.save()
        } catch (e: any) {
          if (e instanceof AutoBackRouteError) {
            return errorHandling(e.message, res, e.code)
          }
          return errorHandling(e.message, res)
        }

        return res.status(200).json(user.get())
      }
    })
  }

  protected filterAllWithoutPassword(): ListFilter {
    const toReturn = activeAllFiltersForAllCols(this.table);
    delete toReturn.password;
    return toReturn
  }

  protected basicGet(accessRule?: access): void {
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

  protected basicDelete(accessRule?: access): void {
    super.addRoute({
      path: '/:user_id',
      type: TypeRoute.DELETE,
      filters: {
        id: {
          equal: {
            name: 'user_id',
            where: InfoPlace.PARAMS,
            transformValue: (value: string) => { return parseInt(value) }
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

  protected routeCheckJWT(): void {
    super.addRoute({
      path: '/jwt',
      type: TypeRoute.POST,
      name: 'JWT check',
      doSomething: async (req, res, route) => {
        const authHeader = req.headers.authorization;

        if (authHeader) {
          const token = authHeader.split(' ')[1];
          try {
            this.checkJWT(token)
          } catch (err: any) {
            if (err.name === 'TokenExpiredError') {
              res.status(408).json({ message: err.toString() });
            } else {
              res.status(406).json({ message: err.toString() });
            }
            res.statusMessage = err.toString()
            return
          }
          res.status(200).json({ "message": "JWT ok" })
        }
      }
    })
  }

  protected login(): void {
    super.addRoute({
      path: '/login',
      type: TypeRoute.POST,
      name: 'Login',
      event: { afterResponse: loginPostmanAfterRequestEvent(this.config.roles) },
      doSomething: async (req, res, route) => {
        if ((!req.body['username'] && !req.body['email']) || !req.body['password']) {
          return errorHandling(new Error('Missing a (username or email) or / and a password.'), res)
        }
        const { username, password } = req.body;

        let user

        if (!username) {
          user = await route.sequelizeData.findOne({ where: { email: req.body.email, password: this.passwordEncode(password, this) } })
        } else {
          user = await route.sequelizeData.findOne({ where: { username: username, password: this.passwordEncode(password, this) } })
        }

        if (user) {
          const temp = user.get()
          delete temp.password
          const accessToken = jwt.sign(temp, this.config.tokenSecret, { expiresIn: this.config.expiresIn });

          res.json({
            ...temp,
            ...{ token: accessToken }
          });
        } else {
          res.status(401).json({ message: 'Username / email or password incorrect' });
          res.statusMessage = 'Username / email or password incorrect'
          return
        }
      }
    })
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  protected checkJWT(token: string): any | undefined {
    let user: any = undefined

    jwt.verify(token, this.config.tokenSecret, (err: any, userJwt: any) => {
      if (err) {
        user = undefined
        throw err
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
    throw Error("The user does not exist")
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

  public async checkToken(token: string, role?: string[], inverse?: boolean, checkRoleDefine?: (user: any) => void): Promise<any> {
    try {
      let user = this.checkJWT(token);
      user = await this.checkUserExist(user, this.sequelizeData);
      this.checkRole(user.role, role, inverse);
      if (checkRoleDefine)
        checkRoleDefine(user);
      return user;
    } catch (error) {
      throw error
    }
  }

  public async checkTokenExpress(req: express.Request, res: express.Response, route: Route): Promise<boolean> {
    if (route.auth) {
      const authHeader = req.headers.authorization;

      if (authHeader) {
        const token = authHeader.split(' ')[1];
        let good: boolean = true;

        (<any>req).user = await this.checkToken(token,
          route.auth && route.auth.role ? route.auth.role : undefined,
          route.auth && route.auth.inverse ? route.auth.inverse : undefined,
          route.auth && route.auth.checkRole ? route.auth.checkRole : undefined
        ).catch((err: Error) => {
          if (err instanceof AutoBackRouteError) {
            errorHandling(err, res, err.code)
          } else if (err.name === 'TokenExpiredError') {
            res.status(408).json({ message: err.toString() });
            res.statusMessage = err.toString()
          } else {
            res.status(403).json({ message: err.toString() });
            res.statusMessage = err.toString()
          }
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