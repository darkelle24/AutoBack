import { ABDataType } from "../_helpers/models/modelsType"
import { DB } from "../_helpers/models/modelsDb"
import { TypeRoute, InfoPlace } from "../_helpers/models/routeModels"
import { DeleteAction } from "../_helpers/models/modelsTable"
import { createAutoBack } from "../_helpers/fn"

//const autoback = new AutoBack("postgres://postgres:password@localhost:5432/test", DB.POSTGRES, true)
//let autoback = new AutoBack("postgres://postgres:password@postgres:5432/test")

const autoback = createAutoBack({
  connnectionStr: "postgres://postgres:password@localhost:5432/test",
  db: DB.POSTGRES,
  activeHealthRoute: true,
  debug: true,
  name: "Test Autoback"
})

autoback.activeAuth({
  config: {
    basicUser: {
      username: 'admin',
      password: 'adminTest24',
      email: 'zoulou@gmail.com',
      role: 'Admin'
    }
  },
  getRoute: {
    active: true,
    auth: {role: ['Admin']}
  }
},
  {
    test: {type: ABDataType.STRING, allowNull: true}
  }
)

const dab = autoback.defineTable('lel', {
  id: { type: ABDataType.BIGINT, primaryKey: true, autoIncrement: true },
  testInitValue: {type: ABDataType.BIGINT, initValue: 0},
  userId: { type: ABDataType.TABLE_LINK, tableToLink: "User", columnsLink: 'id', rename: 'user' },
  testArray: {type: ABDataType.ARRAY, allowNull: true}
}, 'test')

const gitan = autoback.defineTable('gitan', {
  id: { type: ABDataType.BIGINT, primaryKey: true, autoIncrement: true },
  lelId: { type: ABDataType.TABLE_LINK, tableToLink: "lel", columnsLink: 'id', rename: 'lel', multipleResult: false },
}, 'test2')

const multiple = autoback.defineTable('multiple', {
  id: { type: ABDataType.BIGINT, primaryKey: true, autoIncrement: true },
  gitanId: { type: ABDataType.MULTIPLE_LINK_TABLE, allowNull: true, tableToLink: "gitan", columnsLink: 'id', rename: 'gitan', onDelete: DeleteAction.SET_NULL, multipleResult: false },
})

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
}, 'dab', 'Test')

autoback.setUpTables()

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

dab.basicRouting()

dab.addRoute({
  type: TypeRoute.GET,
  path: '/test',
  filters: {userId: {equal: {where: InfoPlace.USERINFO, name: 'id'}}},
  auth: {}
})

gitan.basicRouting()

multiple.basicRouting()

autoback.start(8081).then(()=> {
  autoback.getAPIPostman('Postman.json')
})
