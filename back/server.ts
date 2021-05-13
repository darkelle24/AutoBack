import { DataType, DB } from "../_helpers/models/models"
import { InfoPlace, TypeRoute } from "../_helpers/models/routeModels"
import { AutoBack } from "./autoBack"

let autoback = new AutoBack("postgres://postgres:password@localhost:5432/test", DB.POSTGRES, {config: {}}, true)
//let autoback = new AutoBack("postgres://postgres:password@postgres:5432/test")
let test = autoback.defineTable('lol', {
  id: { type: DataType.BIGINT, primaryKey: true, autoIncrement: true },
  bonjour: { type: DataType.BOOLEAN, defaultValue: true },
  comment: { type: DataType.TEXT, defaultValue: 'No comment' },
  date: {type: DataType.DATE }
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
    returnColumns: {
      list: ["id"],
      inverse: true
    },
    dataAs: {
      comment: {
        where: InfoPlace.QUERYPARAMS,
        force: false
      }
    },
    auth: {

    }
  })
}
autoback.start(8081)
