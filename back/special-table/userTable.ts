import { basicRole, userTableConfig, realUserTableConfig } from './../../_helpers/models/userTableModel';
import { Model, ModelCtor } from 'sequelize';
import { activeAllFiltersForAllCols } from '../../_helpers/fn';
import { saveTable } from '../../_helpers/models/models';
import { InfoPlace, TypeRoute } from '../../_helpers/models/routeModels';
import { TableClass } from '../table';
import jwt from 'jsonwebtoken'
import crypto from 'crypto'


export class UserTableClass<M extends Model> extends TableClass<M> {

  role: string[] = basicRole
  config: realUserTableConfig

  constructor(auth: userTableConfig, name: string, table: saveTable, sequelizeData: ModelCtor<M>, server: any, originRoutePath?: string) {
    super(name, table, sequelizeData, server, originRoutePath)
    this.config = {
      tokenSecret: auth.tokenSecret ? auth.tokenSecret : "wVmNfh6YPJMHtwtbj0Wa43wSh3cvJpoKqoQzZK8QbwjTGEVBNYO8xllNQC2G0U7lfKcVMK5lsn1Tshwl",
      passwordSecret: auth.passwordSecret ? auth.passwordSecret : "pBvhLoQrwTKyk9amfwSabc0zwh5EuV7DDTYpbGG4K52vV9WGftSDhmlz90hMvASJlHk1azg24Uvdturqomx819kz10NS9S",
      expiresIn: auth.expiresIn && auth.expiresIn !== "" ? auth.expiresIn : "7 days"
    }
  }

  basicRouting() {
    if (!this.activeBasicRouting) {
      this.activeBasicRouting = true
      this.basicGet()
      this.basicPost()
      this.basicPut()
      this.login()
      this.register()
    } else {
      console.error('Already activate basic routing on table ' + this.name)
    }
  }

  protected basicGet() {
    super.addRoute({
      path: '/',
      type: TypeRoute.GET,
      filters: activeAllFiltersForAllCols(this.table),
      limit: {},
      offset: {},
      returnColumns: {
        list: ['password'],
        inverse: true
      }
    })
  }

  protected basicDelete() {
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
      }
    })
  }

  protected basicPut() {
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
      dataAs: {
        password: {
          transformValue: (value: string) => { return this.getHash().update(value).digest('hex') },
          force: true
        }
      },
      returnColumns: {
        list: ['password'],
        inverse: true
      }
    })
  }

  protected register() {
    super.addRoute({
      path: '/register',
      type: TypeRoute.POST,
      returnColumns: {
        list: ["password"],
        inverse: true
      },
      dataAs: {
        password: {
          transformValue: (value: string) => { return this.getHash().update(value).digest('hex') },
          force: true
        }
      }
    })
  }

  protected getHash(): crypto.Hmac {
    return crypto.createHmac('sha512', this.config.passwordSecret)
  }

  protected login() {
    super.addRoute({
      path: '/login',
      type: TypeRoute.POST,
      doSomething: async (req, res, route) => {
        const { username, password } = req.body;

        const user = await route.sequelizeData.findOne({ where: { username: username, password: this.getHash().update(password).digest('hex') } })

        if (user) {
          let temp = user.get()
          delete temp.password
          const accessToken = jwt.sign(temp, this.config.tokenSecret, {expiresIn: this.config.expiresIn});

          res.json({
            ...temp,
            ...{ token: accessToken }
          });
        } else {
          res.status(401).json({ message: 'Username or password incorrect'});
        }
      }
    })
  }
}