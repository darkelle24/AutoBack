import { ABDataType } from "../_helpers/models/modelsType"
import { DB } from "../_helpers/models/modelsDb"
import { AutoBack } from "./autoBack"
import { TypeRoute, InfoPlace } from "../_helpers/models/routeModels"

const autoback = new AutoBack("postgres://postgres:password@localhost:5432/test", DB.POSTGRES, {
  config: {
    basicUser: {
      username: 'admin',
      password: 'adminTest24',
      email: 'darkelle24@gmail.com',
      role: 'Admin'
    }
}}, true)
//let autoback = new AutoBack("postgres://postgres:password@postgres:5432/test")
const test = autoback.defineTable('lol', {
  id: { type: ABDataType.BIGINT, primaryKey: true, autoIncrement: true },
  bonjour: { type: ABDataType.BOOLEAN, defaultValue: true, allowNull: true },
  comment: { type: ABDataType.TEXT, defaultValue: 'No comment', allowNull: true },
  date: { type: ABDataType.DATE, allowNull: true },
  array: { type: ABDataType.ARRAY, allowNull: true },
  number: { type: ABDataType.BIGINT, allowNull: true },
  file: { type: ABDataType.FILE, allowNull: true },
  dab: { type: ABDataType.FILE, allowNull: true },
  lol: {type: ABDataType.FILE, allowNull: true}
}, 'dab')

if (test) {
  test.basicRouting({auth: {role: ["Admin"]}})
  test.addRoute({
    type: TypeRoute.POST,
    path: '/lol',
    columsAccept: {
      inverse: true,
      list: ["id"]
    },
    dataAs: {
      comment: {
        where: InfoPlace.QUERYPARAMS,
        force: false
      }
    },
    auth: {
      role: ['User', 'Admin']
    }
  })

  const dab = autoback.defineTable('lel', {
    id: { type: ABDataType.BIGINT, primaryKey: true, autoIncrement: true },
    userId: { type: ABDataType.TABLE_LINK, tableToLink: autoback.userTable, columnsLink: 'id', rename: 'user' },
  }, 'test')
  if (dab) {
    dab.basicRouting()

    const gitan = autoback.defineTable('gitan', {
      id: { type: ABDataType.BIGINT, primaryKey: true, autoIncrement: true },
      userId: { type: ABDataType.TABLE_LINK, tableToLink: dab, columnsLink: 'id', rename: 'lel' },
    }, 'test2')
    if (gitan) {
      gitan.basicRouting()
    }
  }
}
autoback.start(8081)
