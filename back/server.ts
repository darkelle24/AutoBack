import { TableClass } from './table';
import { PostgresDb } from './db/postgres/postgres';
import { DB, Table, DBInterface, DataType, dataTypeInfo, allowNullParams, saveDataTableInfo, dataTableInfo, saveTable, allTables } from '../_helpers/models/models';
import express from "express";
import {
	ReasonPhrases,
	StatusCodes,
} from 'http-status-codes';
import { Sequelize } from 'sequelize';
import { defaultDBToJson, defaultJsonToDB, defaultSaveDataInfo } from '../_helpers/fn';
import * as _ from "lodash"

class AutoBack {

  private server = express();
  private DB: DBInterface
  private startTime = Date.now()
  private sequelize: Sequelize
  tables: allTables = {}
  private defaultSaveDataInfo: any = defaultSaveDataInfo()

  constructor(connnectionStr: string, db: DB = DB.POSTGRES, activeHealthRoute: boolean = true) {
    this.server.use(express.urlencoded({ extended: false }))
    this.server.use(express.json())

    if (db === DB.POSTGRES) {
      this.DB = new PostgresDb();
    } else {
      this.DB = new PostgresDb();
    }
    this.sequelize = new Sequelize(connnectionStr, { logging: false });
    if (activeHealthRoute)
      this.health()
  }

  /**
     * Call after you init all your routes
  */

  start(port: number = 8080) {
    this.sequelize.sync()
    this.server.listen(port, () => {
      console.log('Server listenning on port ' + port)
    });
    this.error404()
  }

  loadDb(db: DB, connnectionStr: string) {
    if (db === DB.POSTGRES) {
      this.DB = new PostgresDb();
    }
    this.sequelize = new Sequelize(connnectionStr, { logging: false });
  }

  private health() {
    this.server.get('/health', (req, res) => {
      let time = Date.now() - this.startTime
      res.status(StatusCodes.OK).json({
        uptime: {
          diff: time,
          ms: Math.floor(time % 1000),
          s: Math.floor(time / 1000 % 60),
          m: Math.floor(time / 60000 % 60),
          h: Math.floor(time / 3600000 % 24),
          d: Math.floor(time / 86400000)
        }
      })
    })
  }

  private error404() {
    this.server.use(function(req, res, next){
      res.status(StatusCodes.NOT_FOUND).json({message: "This route doesn't exist"})
    });
  }

  defineTable(nameTable: string, table: Table, originRoutePath?: string): TableClass<any> | undefined {
    let tableSequelize = undefined
    let saveTableInfo: any = {}
    let tableSequelizeInfo = this.createTableSequelizeInfo(table, saveTableInfo)

    if (this.sequelize)
      tableSequelize = this.sequelize.define(nameTable, tableSequelizeInfo)
    if (tableSequelize)
      this.tables[nameTable] = new TableClass(nameTable, saveTableInfo, tableSequelize, this.server, originRoutePath)
    return this.tables[nameTable]
  }

  private createTableSequelizeInfo(table: Table, saveTableInfo: any): any {
    let tableSequelizeInfo: any = {}

    Object.keys(table).forEach((key) => {
      let type = this.getDataType(table[key].type)
      if (type) {
        tableSequelizeInfo[key] = {}
        tableSequelizeInfo[key].type = type.sequelizeType;
        tableSequelizeInfo[key].primaryKey = table[key].primaryKey || false;
        tableSequelizeInfo[key].autoIncrement = table[key].autoIncrement || false;
        tableSequelizeInfo[key].allowNull = this.gestParametersTableAllowNull(table, key, table[key].allowNull)
        saveTableInfo[key] = this.saveDataInfo(table[key], type)
      }
    });
    return tableSequelizeInfo
  }

  private gestParametersTableAllowNull(table: Table, key: string, allowNull: any = false): boolean {
    if (allowNull && typeof allowNull !== "boolean" && allowNull.keepOldValue === true) {
      table[key].allowNull = { keepOldValue: true }
      return true
    } else if (allowNull === true) {
      table[key].allowNull = { keepOldValue: false }
      return false
    }
    return false
  }

  private saveDataInfo(dataInfo: dataTableInfo, type: dataTypeInfo): saveDataTableInfo {
    let temp = _.merge(this.defaultSaveDataInfo, dataInfo)
    temp.allowNull = dataInfo.allowNull as allowNullParams
    temp.type = type

    return temp
  }

  private getDataType(data: DataType): dataTypeInfo | undefined {
    let type = this.DB.dataType[data]

    if (type === undefined) {
      console.error(data + " type in " + this.DB.dbName + " is not supported")
    } else {
      type.autobackDataType = data
      if (!type.DBToJson) {
        type.DBToJson = defaultDBToJson
      }
      if (!type.JsonToDB) {
        type.JsonToDB = defaultJsonToDB
      }
    }
    return type
  }
}

let autoback = new AutoBack("postgres://postgres:password@localhost:5432/test")
autoback.defineTable('test', {
  id: { type: DataType.BIGINT, primaryKey: true, autoIncrement: true },
  bonjour: { type: DataType.BOOLEAN }
})
let test = autoback.defineTable('lol', {
  id: { type: DataType.BIGINT, primaryKey: true, autoIncrement: true },
  bonjour: { type: DataType.BOOLEAN }
}, 'dab')

if (test)
  test.basicRouting()
autoback.start(8081)
