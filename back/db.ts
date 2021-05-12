import { TableClass } from './table';
import { PostgresDb } from './db/postgres/postgres';
import { DB, Table, DBInterface, DataType, dataTypeInfo, allowNullParams, saveDataTableInfo, dataTableInfo, saveTable, allTables, realDataTypeInfo } from '../_helpers/models/models';
import express from "express";
import {
	ReasonPhrases,
	StatusCodes,
} from 'http-status-codes';
import { ModelCtor, Sequelize } from 'sequelize';
import { defaultDBToJson, defaultJsonToDB, defaultSaveDataInfo } from '../_helpers/fn';
import * as _ from "lodash"
import { InfoPlace, TypeRoute } from '../_helpers/models/routeModels';
import { userTableDefine } from '../_helpers/models/userTableModel';
import { UserTableClass } from './special-table/userTable';

export class AutoBack {

  private server = express();
  private DB: DBInterface
  private startTime = Date.now()
  private sequelize: Sequelize
  tables: allTables = {}
  private defaultSaveDataInfo: any = defaultSaveDataInfo()
  private waitDestroyDb?: Promise<void>
  private userTable?: UserTableClass<any>

  constructor(connnectionStr: string, db: DB = DB.POSTGRES, activeHealthRoute: boolean = true, resetDb: boolean = false) {
    this.server.use(express.urlencoded({ extended: false }))
    this.server.use(express.json())

    if (db === DB.POSTGRES) {
      this.DB = new PostgresDb();
    } else {
      this.DB = new PostgresDb();
    }
    this.sequelize = new Sequelize(connnectionStr, { logging: false });
    if (resetDb) {
      this.waitDestroyDb = this.resetDb()
    }
    if (activeHealthRoute)
      this.health()
    this.userTable = undefined
  }

  private async resetDb() {
    await this.sequelize.drop()
    await this.sequelize.sync().then(() => console.log('All tables dropped'))
  }

  /**
     * Call after you init all your routes and tables
  */

  private async startFn(port: number = 8080) {
    await this.sequelize.sync().then(() => console.log('Created all Tables'))
    this.server.listen(port, () => {
      console.log('Server listening on port ' + port)
    });
    this.error404()
  }

  async start(port: number = 8080) {
    if (this.waitDestroyDb) {
      this.waitDestroyDb.finally(async () => {
        await this.startFn(port)
      })
    } else {
      await this.startFn(port)
    }
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
    this.server.use(function (req, res, next) {
      res.status(StatusCodes.NOT_FOUND).json({ message: "This route doesn't exist" })
    });
  }

  defineUserTable(): UserTableClass<any> | undefined {
    if (!this.userTable) {
      let [tableSequelize, saveTableInfo] = this.defineStartTable("User", userTableDefine)

      if (tableSequelize)
        this.tables["User"] = new UserTableClass("User", saveTableInfo, tableSequelize, this.server, '/auth')

      if (this.tables["User"]) {
        this.userTable = (this.tables["User"] as UserTableClass<any>)
        return this.userTable
      }
      return this.userTable
    } else {
      return this.userTable
    }
  }

  private defineStartTable(nameTable: string, table: Table): [ModelCtor<any> | undefined, saveTable] {
    let tableSequelize = undefined
    let [tableSequelizeInfo, saveTableInfo]  = this.createTableSequelizeInfo(table)

    if (this.sequelize)
      tableSequelize = this.sequelize.define(nameTable, tableSequelizeInfo)
    return [tableSequelize, saveTableInfo]
  }

  defineTable(nameTable: string, table: Table, originRoutePath?: string): TableClass<any> | undefined {
    let [tableSequelize, saveTableInfo] = this.defineStartTable(nameTable, table)

    if (tableSequelize)
      this.tables[nameTable] = new TableClass(nameTable, saveTableInfo, tableSequelize, this.server, originRoutePath)
    return this.tables[nameTable]
  }

  private createTableSequelizeInfo(table: Table): [any, saveTable] {
    let tableSequelizeInfo: any = {}
    let saveTableInfo: saveTable = {}

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
    return [tableSequelizeInfo, saveTableInfo]
  }

  private gestParametersTableAllowNull(table: Table, key: string, allowNull: any = false): boolean {
    if (allowNull && typeof allowNull !== "boolean" && allowNull.keepOldValue === true) {
      table[key].allowNull = { keepOldValue: true }
      return true
    } else if (allowNull === true) {
      table[key].allowNull = { keepOldValue: false }
      return true
    }
    return false
  }

  private saveDataInfo(dataInfo: dataTableInfo, type: realDataTypeInfo): saveDataTableInfo {
    let temp = _.merge({}, this.defaultSaveDataInfo, dataInfo)
    temp.allowNull = dataInfo.allowNull as allowNullParams
    temp.type = type

    return temp
  }

  private getDataType(data: DataType): realDataTypeInfo | undefined {
    let type = this.DB.dataType[data]

    if (type === undefined) {
      console.error(data + " type in " + this.DB.dbName + " is not supported")
    }
    return type
  }
}
