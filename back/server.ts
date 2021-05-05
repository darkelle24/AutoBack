import { TableClass } from './../_helpers/class';
import { PostgresDb } from './db/postgres/postgres';
import { DB, Table, DBInterface, DataType, dataTypeInfo, allowNullParams, saveDataTableInfo, dataTableInfo, saveTable, allTables } from './../_helpers/models';
import express from "express";
import {
	ReasonPhrases,
	StatusCodes,
} from 'http-status-codes';
import { Sequelize } from 'sequelize';
import { defaultDBToJson, defaultJsonToDB } from '../_helpers/fn';

class AutoBack {

  private server = express();
  private DB: DBInterface
  private startTime = Date.now()
  private sequelize: Sequelize
  tables: allTables = {}

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

  public start(port: number = 8080) {
    this.server.listen(port, () => {
      console.log('Server listenning on port ' + port)
    });
  }

  public loadDb(db: DB, connnectionStr: string) {
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

  defineTable(nameTable: string, table: Table) {
    let tableSequelize = undefined
    let saveTableInfo: any = {}
    let tableSequelizeInfo = this.createTableSequelizeInfo(table, saveTableInfo)

    if (this.sequelize)
      tableSequelize = this.sequelize.define(nameTable, tableSequelizeInfo)
    if (tableSequelize)
      this.tables[nameTable] = new TableClass(nameTable, saveTableInfo, tableSequelize)
  }

  createTableSequelizeInfo(table: Table, saveTableInfo: any): any {
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

  gestParametersTableAllowNull(table: Table, key: string, allowNull: any = false): boolean {
    if (allowNull && typeof allowNull !== "boolean" && allowNull.keepOldValue === true) {
      table[key].allowNull = { keepOldValue: true }
      return true
    } else if (allowNull === true) {
      table[key].allowNull = { keepOldValue: false }
      return false
    }
    table[key].allowNull = undefined
    return false
  }

  saveDataInfo(dataInfo: dataTableInfo, type: dataTypeInfo): saveDataTableInfo {
    return {
      type: type,
      primaryKey: dataInfo.primaryKey || false,
      autoIncrement: dataInfo.autoIncrement || false,
      comment: dataInfo.comment,
      allowNull: dataInfo.allowNull as allowNullParams
    }
  }

  getDataType(data: DataType): dataTypeInfo | undefined {
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

let autoback = new AutoBack("postgres://postgres:password@postgres/test")
autoback.start(8081)
autoback.defineTable('test', {
  id: { type: DataType.BIGINT, primaryKey: true, autoIncrement: true },
  bonjour: { type: DataType.BOOLEAN }
})
autoback.defineTable('lol', {
  id: { type: DataType.BIGINT, primaryKey: true, autoIncrement: true },
  bonjour: { type: DataType.BOOLEAN }
})
