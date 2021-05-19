import { DataType, DB } from "../_helpers/models/models"
import { InfoPlace, TypeRoute } from "../_helpers/models/routeModels"
import { AutoBack } from "./autoBack"

let autoback = new AutoBack("postgres://postgres:password@localhost:5432/test", DB.POSTGRES, {
  config: {
    basicUser: {
      username: 'admin',
      password: 'adminTest24',
      email: 'darkelle24@gmail.com',
      role: 'Admin'
    }
}}, true)
//let autoback = new AutoBack("postgres://postgres:password@postgres:5432/test")
let test = autoback.defineTable('lol', {
  id: { type: DataType.BIGINT, primaryKey: true, autoIncrement: true },
  bonjour: { type: DataType.BOOLEAN, defaultValue: true, allowNull: true },
  comment: { type: DataType.TEXT, defaultValue: 'No comment', allowNull: true },
  date: { type: DataType.DATE, allowNull: true },
  array: { type: DataType.ARRAY, allowNull: true },
  number: { type: DataType.BIGINT, allowNull: true },
  file: { type: DataType.FILE, allowNull: true },
  dab: { type: DataType.FILE, allowNull: true },
  lol: {type: DataType.FILE, allowNull: true}
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
    /* returnColumns: {
      list: ["id"],
      inverse: true
    }, */
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
}
autoback.start(8081)
