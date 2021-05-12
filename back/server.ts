import { DataType, DB } from "../_helpers/models/models"
import { InfoPlace, TypeRoute } from "../_helpers/models/routeModels"
import { AutoBack } from "./db"

let autoback = new AutoBack("postgres://postgres:password@localhost:5432/test", DB.POSTGRES, true, true)
//let autoback = new AutoBack("postgres://postgres:password@postgres:5432/test")
let test = autoback.defineTable('lol', {
  id: { type: DataType.BIGINT, primaryKey: true, autoIncrement: true },
  bonjour: { type: DataType.BOOLEAN, allowNull: { keepOldValue: true }, defaultValue: true },
  comment: { type: DataType.TEXT, defaultValue: 'No comment' },
  date: {type: DataType.DATE, allowNull: { keepOldValue: true } }
}, 'dab')

let user = autoback.defineUserTable()
if (user) {
  user.basicRouting()
}

if (test) {
  test.basicRouting()
  test.addRoute({
    type: TypeRoute.POST,
    path: '/lol',
    columsAccept: {
      inverse: true,
      whitelist: ["id"]
    },
    returnColumns: {
      whitelist: ["id"],
      inverse: true
    },
    dataAs: {
      comment: {
        where: InfoPlace.QUERYPARAMS,
        force: false
      }
    }
  })
}
autoback.start(8081)
