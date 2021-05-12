import { Model, ModelCtor } from 'sequelize';
import { activeAllFiltersForAllCols } from '../../_helpers/fn';
import { saveTable } from '../../_helpers/models/models';
import { InfoPlace, TypeRoute } from '../../_helpers/models/routeModels';
import { TableClass } from '../table';


export class UserTableClass<M extends Model> extends TableClass<M> {

  constructor(name: string, table: saveTable, sequelizeData: ModelCtor<M>, server: any, originRoutePath?: string) {
    super(name, table, sequelizeData, server, originRoutePath)
  }

  basicRouting() {
    if (!this.activeBasicRouting) {
      this.activeBasicRouting = true
      this.basicGet()
      this.basicPost()
      this.basicPut()
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
        whitelist: ['password'],
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
      returnColumns: {
        whitelist: ['password'],
        inverse: true
      }
    })
  }
}