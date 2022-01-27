import { ABDataType } from "../_helpers/models/modelsType"
import { DB } from "../_helpers/models/modelsDb"
import { TypeRoute, InfoPlace } from "../_helpers/models/routeModels"
import { DeleteAction } from "../_helpers/models/modelsTable"
import { createAutoBack } from "../_helpers/fn"

//const autoback = new AutoBack("postgres://postgres:password@localhost:5432/test", DB.POSTGRES, true)
//let autoback = new AutoBack("postgres://postgres:password@postgres:5432/test")

require('dotenv').config()

const autoback = createAutoBack({
  connnectionStr: "postgres://postgres:password@localhost:5432/test",
  db: DB.POSTGRES,
  activeHealthRoute: true,
  debug: true,
  name: "Test Autoback",
  socketActive: true
})

// Need to have .env with correct info about mail to use this exemple

/* autoback.addMailAccount("mdp", {
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_FROM_EMAIL,
    pass: process.env.SMTP_FROM_PASSWORD,
  },
}) */

autoback.activeAuth({
  config: {
    basicUser: {
      username: 'admin',
      password: 'adminTest24',
      email: 'zoulou@gmail.com',
      role: 'Admin'
    },
    // Need to have mail account
    //nameAccountMailRecupMDP: "mdp"
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


// Need to have .env with correct info about mail to use this exemple

/* autoback.addMailAccount("test", {
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_FROM_EMAIL,
    pass: process.env.SMTP_FROM_PASSWORD,
  },
})

autoback.sendMail("test", {
  from: process.env.SMTP_FROM_EMAIL,
  to: process.env.SMTP_TO_EMAIL,
  subject: 'New Contact Form Submission',
  text: `test`,
}).then(() => {
  console.log("ok")
}) */

/* const dab = autoback.defineTable('lel', {
  id: { type: ABDataType.BIGINT, primaryKey: true, autoIncrement: true },
  testInitValue: {type: ABDataType.BIGINT, initValue: 0},
  userId: {
    type: ABDataType.TABLE_LINK, tableToLink: "User", columnsLink: 'id', rename: 'user', transformGetLinkedData: (value: any) => {
      delete value.email
      delete value.phone
      delete value.test
  } },
  testArray: {type: ABDataType.ARRAY, allowNull: true}
}, 'test')

const gitan = autoback.defineTable('gitan', {
  id: { type: ABDataType.BIGINT, primaryKey: true, autoIncrement: true },
  lelId: { type: ABDataType.TABLE_LINK, tableToLink: "lel", columnsLink: 'id', rename: 'lel', multipleResult: false },
}, 'test2')

const multiple = autoback.defineTable('multiple', {
  id: { type: ABDataType.BIGINT, primaryKey: true, autoIncrement: true },
  gitanId: { type: ABDataType.MULTIPLE_LINK_TABLE, allowNull: true, tableToLink: "gitan", columnsLink: 'id', rename: 'gitan', onDelete: DeleteAction.SET_NULL, multipleResult: false },
}) */

const test = autoback.defineTable('lol', {
  id: { type: ABDataType.BIGINT, primaryKey: true, autoIncrement: true },
  bonjour: { type: ABDataType.BOOLEAN, defaultValue: true, allowNull: true },
  comment: { type: ABDataType.TEXT, defaultValue: 'No comment', allowNull: true },
  date: { type: ABDataType.DATE, allowNull: true },
  array: { type: ABDataType.ARRAY, allowNull: true },
  number: { type: ABDataType.BIGINT, allowNull: true },
  file: { type: ABDataType.FILE, allowNull: true, extAuthorize: ['.pdf'], deleteOldFileOnPut: false },
  dab: { type: ABDataType.FILE, allowNull: true, extAuthorize: ['.pdf'] },
  lol: {type: ABDataType.FILE, allowNull: true, extAuthorize: ['.png']}
}, 'dab', 'Test', { auth: { role: ["Admin"] }, path: '/lol'})

/* const patient = autoback.defineTable('patient', {
  id: { type: ABDataType.BIGINT, primaryKey: true, autoIncrement: true },
  nom: {type: ABDataType.STRING, allowNull: true},
  prenom: {type: ABDataType.STRING, allowNull: true},
  age: {type: ABDataType.STRING, allowNull: true},
  mail: {type: ABDataType.STRING, allowNull: true, validate: {isEmail: true}},
  telephone: {type: ABDataType.STRING, allowNull: true},
}
)

const adresse = autoback.defineTable('adresse', {
  id: { type: ABDataType.BIGINT, primaryKey: true, autoIncrement: true },
  adresse: {type: ABDataType.STRING, allowNull: true},
  patient_id: { type: ABDataType.TABLE_LINK, allowNull: false, tableToLink: 'patient', columnsLink: 'id' }
}
); */

autoback.setUpTables()

/* patient.basicRouting()
adresse.basicRouting()


patient.addRoute({
  type: TypeRoute.GET,
  path: '/lol',
  beforeSendAfterRecursive: async (req, res, routeClass, datas) => {
    return Promise.all(datas.map(async (element: any) => {
      return autoback.tables['adresse'].sequelizeData.findAll({ where: { patient_id: element.id } }).then((result: any[]) => {
        element.addresses = result.map((oneResult: any) => { return oneResult.get() })
      })
    }))
  }
}) */

test.basicRouting({auth: {role: ["Admin"]}})
test.addRoute({
  type: TypeRoute.POST,
  path: '/lol',
  columsAccept: {
    inverse: true,
    list: ["id"]
  },
  beforeSetValue: (req, res) => {
    console.log(req.user)
  },
  dataAs: {
    comment: {
      where: InfoPlace.QUERYPARAMS,
      force: false
    }
  },
  auth: {
    role: ['User']
  }
})

/* dab.basicRouting()

dab.addRoute({
  type: TypeRoute.GET,
  path: '/test',
  filters: {userId: {equal: {where: InfoPlace.USERINFO, name: 'id'}}},
  auth: {}
})

gitan.basicRouting()

multiple.basicRouting() */

autoback.start(8081).then(()=> {
  autoback.getAPIPostman('Postman.json')
})
