import { filePathInfo, tempSaveTable } from './../_helpers/models/models';
import { TableClass } from './table';
import { PostgresDb } from './db/postgres/postgres';
import { DB, Table, DBInterface, DataType, dataTypeInfo, saveDataTableInfo, dataTableInfo, saveTable, allTables, realDataTypeInfo, realDataType } from '../_helpers/models/models';
import express from "express";
import {
	ReasonPhrases,
	StatusCodes,
} from 'http-status-codes';
import { ModelCtor, Sequelize } from 'sequelize';
import { addPath, defaultDBToJson, defaultJsonToDB, defaultSaveDataInfo, removeFile } from '../_helpers/fn';
import * as _ from "lodash"
import { InfoPlace, TypeRoute } from '../_helpers/models/routeModels';
import { authConfigAutoBack, userTableConfig, userTableDefine } from '../_helpers/models/userTableModel';
import { UserTableClass } from './special-table/userTable';
import { applyValidator } from '../_helpers/validator';
import cors from 'cors'
import path from 'path';
import fs from 'fs'

export class AutoBack {

  private server = express();
  private DB: DBInterface
  private startTime = Date.now()
  private sequelize: Sequelize
  tables: allTables = {}
  private defaultSaveDataInfo: any = defaultSaveDataInfo()
  private waitDestroyDb?: Promise<void>
  private userTable?: UserTableClass<any> = undefined
  readonly fileInfo: filePathInfo
  readonly serverPath: string

  constructor(connnectionStr: string, db: DB = DB.POSTGRES, auth?: authConfigAutoBack | boolean, activeHealthRoute: boolean = true, fileInfo?: filePathInfo, serverPath: string = "api/", resetDb: boolean = false) {
    this.server.use(express.urlencoded({ extended: false }))
    this.server.use(express.json())
    this.server.use(cors());

    if (!fileInfo)
      fileInfo = {
        folderPath: 'uploads',
        virtualPath: '/uploads'
      }
    this.fileInfo = fileInfo
    this.serverPath = serverPath

    if (!fs.existsSync(this.fileInfo.folderPath)){
      fs.mkdirSync(this.fileInfo.folderPath);
    }

    if (!fileInfo.virtualPath)
      this.server.use(express.static(this.fileInfo.folderPath));
    else
      this.server.use(fileInfo.virtualPath, express.static(this.fileInfo.folderPath));

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
    if (auth) {
      if (auth === true)
        auth = {}
      if (!auth.config)
        auth.config= {}
      this.userTable = this.defineUserTable(auth.config)
      if (this.userTable)
        this.userTable.basicRouting(auth.getRoute, auth.postRoute, auth.putRoute, auth.deleteRoute)
    }
  }

  public addTypes(newTypes: realDataType) {
    this.DB.addTypes(newTypes)
  }

  private async resetDb() {
    await this.sequelize.drop()
    await this.sequelize.sync().then(() => console.log('All tables dropped'))
  }

  private async startFn(port: number = 8080) {
    await this.sequelize.sync().then(() => {
      console.log('Created all Tables')
      if (this.userTable && this.userTable.config.basicUser) {
        return this.userTable.sequelizeData.create(
          this.userTable.config.basicUser
        ).then(data => {
          console.log('Succefully create basic user')
        }).catch(err => {
          if (err.errors !== undefined) {
            console.warn(err.name + ': ' + err.errors[0].message )
          } else {
            console.warn(err.toString())
          }
        })
      }
    })
    this.server.listen(port, () => {
      console.log('Server listening on port ' + port)
    });
    this.error404()
  }

  /**
     * Call after you init all your routes and tables
  */

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

  private defineUserTable(auth: userTableConfig): UserTableClass<any> | undefined {
    if (!this.userTable) {
      let [tableSequelize, saveTableInfo] = this.defineStartTable("User", userTableDefine)

      if (tableSequelize) {
        this.tables["User"] = new UserTableClass(auth, "User", saveTableInfo.saveTable, tableSequelize, this.server, this.fileInfo.folderPath, this.serverPath, '/auth')
        saveTableInfo.table = this.tables["User"]
      }

      if (this.tables["User"]) {
        this.userTable = (this.tables["User"] as UserTableClass<any>)
        return this.userTable
      }
      return this.userTable
    } else {
      return this.userTable
    }
  }

  private defineStartTable(nameTable: string, table: Table): [ModelCtor<any> | undefined, tempSaveTable] {
    let tableSequelize = undefined
    let [tableSequelizeInfo, saveTableInfo] = this.createTableSequelizeInfo(table, nameTable, this.fileInfo)

    if (this.sequelize)
      tableSequelize = this.sequelize.define(nameTable, tableSequelizeInfo)
    return [tableSequelize, saveTableInfo]
  }

  defineTable(nameTable: string, table: Table, originRoutePath?: string): TableClass<any> | undefined {
    let [tableSequelize, saveTableInfo] = this.defineStartTable(nameTable, table)

    if (tableSequelize) {
      this.tables[nameTable] = new TableClass(nameTable, saveTableInfo.saveTable, tableSequelize, this.server, this.fileInfo.folderPath, this.serverPath, originRoutePath, this.userTable)
      saveTableInfo.table = this.tables[nameTable]
    }
    return this.tables[nameTable]
  }

  private createTableSequelizeInfo(table: Table, nameTable: string, fileInfo: filePathInfo): [any, tempSaveTable] {
    let tableSequelizeInfo: any = {}
    let saveTableInfo: saveTable = {}
    let tempSaveTable: tempSaveTable = {
      saveTable: {}
    }

    Object.keys(table).forEach((key) => {
      let type = this.getDataType(table[key].type)
      if (type) {
        saveTableInfo[key] = this.saveDataInfo(table[key], type)

        tableSequelizeInfo[key] = {
          type: type.sequelizeType,
          primaryKey: saveTableInfo[key].primaryKey,
          autoIncrement: saveTableInfo[key].autoIncrement,
          allowNull: saveTableInfo[key].allowNull,
          unique: saveTableInfo[key].unique,
          get() {
            let value = this.getDataValue(key)
            if (value !== undefined && value !== NaN && value !== null) {
              if (type && type.DBToJson) {
                value = type.DBToJson(value)
              }
              if (type && type.autobackDataType === DataType.FILE && fileInfo.virtualPath) {
                value = path.posix.join(fileInfo.virtualPath, nameTable, key, value)
                if (!fs.existsSync(value))
                  value = undefined
              }
              if (saveTableInfo[key] && saveTableInfo[key].transformGet) {
                // @ts-ignore
                value = saveTableInfo[key].transformGet(value, tempSaveTable.table)
              }
            }
            return value
          },
          set(value: any) {
            if (value !== undefined && value !== NaN && value !== null) {
              if (saveTableInfo[key].validate !== undefined) {
                // @ts-ignore
                applyValidator(key, value, saveTableInfo[key].validate)
              }
              if (saveTableInfo[key] && saveTableInfo[key].transformSet) {
                // @ts-ignore
                value = saveTableInfo[key].transformSet(value, tempSaveTable.table)
              }
              if (type && type.JsonToDB)
                value = type.JsonToDB(value)
              if (type && type.autobackDataType === DataType.FILE && fileInfo.folderPath) {
                let oldValue = this.getDataValue(key)

                if (oldValue) {
                  let pathOldValue = path.join(fileInfo.folderPath, nameTable, key, oldValue)
                  removeFile(pathOldValue)
                }
              }
            }
            this.setDataValue(key, value)
          }
        }
      }
    });
    tempSaveTable.saveTable = saveTableInfo
    return [tableSequelizeInfo, tempSaveTable]
  }

  private saveDataInfo(dataInfo: dataTableInfo, type: realDataTypeInfo): saveDataTableInfo {
    let temp = _.merge({}, this.defaultSaveDataInfo, dataInfo)
    temp.type = type

    if (temp.validate)
      temp.validate = _.merge({}, type.validate, temp.validate)
    else
      temp.validate = _.merge({}, type.validate)

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
