import { ABDataType } from "../_helpers/models/modelsType"
import { DB } from "../_helpers/models/modelsDb"
import { AutoBack } from "./autoBack"
import { TypeRoute, InfoPlace } from "../_helpers/models/routeModels"
import { DeleteAction } from "../_helpers/models/modelsTable"
import { TableClass } from "./table"
import axios from "axios"
import { Model} from "sequelize";
import {assert} from 'chai'

const autoback = new AutoBack(`postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:5432/${process.env.POSTGRES_DB}`, DB.POSTGRES, {
  config: {
    basicUser: {
      username: 'admin',
      password: 'adminTest24',
      email: 'darkelle24@gmail.com',
      role: 'Admin'
    }
}}, true, undefined, undefined, undefined, process.env.MODE === 'test' ? true : undefined)

const test = autoback.defineTable('test', {
  id: { type: ABDataType.BIGINT, primaryKey: true, autoIncrement: true },
  bonjour: { type: ABDataType.BOOLEAN, defaultValue: true, allowNull: true },
  comment: { type: ABDataType.TEXT, defaultValue: 'No comment', allowNull: true },
  date: { type: ABDataType.DATE, allowNull: true },
  array: { type: ABDataType.ARRAY, allowNull: true },
  number: { type: ABDataType.BIGINT, allowNull: true }
}, 'test')

if (test) {
  test.basicRouting()
  test.addTest((table: TableClass<Model>): Promise<unknown> => {
    const basicEntry = {bonjour: false, comment: "comment test"}
    return axios.post('http://app:8000' + table.routes.originRoutePath, basicEntry).then(result => {
      table.sequelizeData.findAll().then(datas => {
        let entry_found: boolean = false
        for(const data of datas) {
          console.log(data.get())
          if (data.get().id === result.data.id) {
            entry_found = true
          }
        }
        assert.isTrue(false, "The new entry must be found in the get")
      })
    })
  })
}

const test_2 = autoback.defineTable('test_2', {
  id: { type: ABDataType.BIGINT, primaryKey: true, autoIncrement: true },
  bool: { type: ABDataType.BOOLEAN, defaultValue: true, allowNull: true },
  string: { type: ABDataType.STRING, allowNull: true },
  float: { type: ABDataType.FLOAT, allowNull: true }
}, 'test_2')

if (test_2) {
  test_2.basicRouting()
}

console.log(process.env.PORT)
autoback.start(+process.env.PORT)
