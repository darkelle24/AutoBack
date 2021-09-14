import { TableClass } from './table';
import { PostgresDb } from './db/postgres/postgres';
import express from "express";
import {StatusCodes} from 'http-status-codes';
import { ModelAttributes, ModelCtor, Sequelize } from 'sequelize';
import { defaultSaveDataInfo, removeFile, addPath, formatDate } from '../_helpers/fn';
import * as _ from "lodash"
import { authConfigAutoBack, userTableConfig, userTableDefine } from '../_helpers/models/userTableModel';
import { UserTableClass } from './special-table/userTable';
import { applyValidator } from '../_helpers/validator';
import cors from 'cors'
import path from 'path';
import fs from 'fs'
import { filePathInfo } from '../_helpers/models/models';
import { ABDataType, realDataType, realDataTypeInfo } from '../_helpers/models/modelsType';
import { DBInterface, DB } from '../_helpers/models/modelsDb';
import { allTables, Table, tempSaveTable, saveDataTableInfo, saveTable, dataTableInfo, realDataLinkTable, dataLinkTable, DeleteAction } from '../_helpers/models/modelsTable';
import morgan from 'morgan'
import compression from 'compression'

export class AutoBack {

  private server = express();
  private DB: DBInterface
  private startTime = Date.now()
  private sequelize: Sequelize
  tables: allTables = {}
  private defaultSaveDataInfo: any = defaultSaveDataInfo()
  private waitDestroyDb?: Promise<void>
  private _userTable?: UserTableClass<any> = undefined
  get userTable(): UserTableClass<any> | undefined  {
    return this._userTable
  }
  readonly fileInfo: filePathInfo
  readonly serverPath: string

  constructor(connnectionStr: string, db: DB = DB.POSTGRES, activeHealthRoute: boolean = true, fileInfo?: filePathInfo, serverPath: string = "api/", activeLog: boolean = true, resetDb: boolean = false) {
    this.server.use(compression());
    this.server.use(express.urlencoded({ extended: false }))
    this.server.use(express.json())
    this.server.use(cors());

    if (!fileInfo) {
      fileInfo = {
        folderPath: 'uploads',
        virtualPath: 'uploads'
      }
    }
    if (fileInfo && !fileInfo.virtualPath) {
      fileInfo.virtualPath = 'uploads'
    }

    if (activeLog) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const rfs = require("rotating-file-stream");

      const generator = (time: Date, index?: number) => {
        if (!time) return "access.log";

        return [formatDate(time), index, 'access.log'].join('-');
      };

      morgan.token('auth', function (req: any) {
        if (!req.user) {
          return 'Is not authenticated'
        } else {
          return "id: " + req.user.id + " username: " + req.user.username + " role: " + req.user.role
        }
      })

      morgan.token('statusMessage', function (req: any, res: any) {
        return res.statusMessage
      })

      const accessLogStream = rfs.createStream(generator, {
        path: path.join(__dirname, 'logs'),
        maxFiles: 31,
        intervalBoundary: true,
        interval: "1d",
      })

      this.server.use(morgan(':remote-addr - :auth - [:date[web]] ":method :url HTTP/:http-version" :status ":statusMessage" :res[content-length] ":referrer" ":user-agent" - :response-time ms', { stream: accessLogStream }))
    }

    this.fileInfo = fileInfo
    this.serverPath = serverPath

    if (!fs.existsSync(this.fileInfo.folderPath)){
      fs.mkdirSync(this.fileInfo.folderPath);
    }

    if (fileInfo.virtualPath) {
      fileInfo.virtualPath = addPath('/', fileInfo.virtualPath)
      this.server.use(fileInfo.virtualPath, (req, res) => {
        const splitedUrl = req.originalUrl.split('/')
        const path = addPath(this.fileInfo.folderPath, splitedUrl.slice(2).join('/'))
        if (fs.existsSync(path))
          res.download(path)
        else {
          res.status(404).json({ message: "File not found" })
          res.statusMessage = "File not found"
        }
      });
    }

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
  }

  public addTypes(newTypes: realDataType): void {
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
        ).then(() => {
          console.log('Succefully create basic user')
        }).catch((err: any) => {
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
     * Call after you construct AutoBack class
  */

  public activeAuth(auth?: authConfigAutoBack | boolean, userDefine: Table = userTableDefine, userTableClass: typeof UserTableClass = UserTableClass): void {
    if (auth) {
      if (auth === true)
        auth = {}
      if (!auth.config)
        auth.config = {}
      const userTable = this.defineUserTable(auth.config, userDefine, userTableClass)
      if (userTable)
        this._userTable = userTable
      if (this.userTable)
        this.userTable.basicRouting(auth.getRoute, auth.postRoute, auth.putRoute, auth.deleteRoute)
    }
  }

  /**
     * Call after you init all your routes and tables
  */

  async start(port: number = 8080): Promise<void> {
    if (this.waitDestroyDb) {
      this.waitDestroyDb.finally(async () => {
        await this.startFn(port)
      })
    } else {
      await this.startFn(port)
    }
  }

  loadDb(db: DB, connnectionStr: string): void {
    if (db === DB.POSTGRES) {
      this.DB = new PostgresDb();
    }
    this.sequelize = new Sequelize(connnectionStr, { logging: false });
  }

  private health() {
    this.server.get(addPath('/', addPath(this.serverPath, '/health')), (req, res) => {
      const time = Date.now() - this.startTime
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
    this.server.use(function (req, res) {
      res.status(StatusCodes.NOT_FOUND).json({ message: "This route doesn't exist" })
      res.statusMessage = "This route doesn't exist"
    });
  }

  private defineUserTable(auth: userTableConfig, userDefine: Table = userTableDefine, userTableClass: typeof UserTableClass = UserTableClass): UserTableClass<any> | undefined {
    if (!this.userTable) {
      userDefine = _.merge(userTableDefine, userDefine)
      const [tableSequelize, saveTableInfo] = this.defineStartTable("User", userDefine)

      if (tableSequelize) {
        this.tables["User"] = new userTableClass(auth, "User", saveTableInfo.saveTable, tableSequelize, this.server, this.fileInfo.folderPath, this.serverPath, '/auth')
        saveTableInfo.table = this.tables["User"]
      }

      if (this.tables["User"]) {
        this._userTable = (this.tables["User"] as UserTableClass<any>)
        return this.userTable
      }
      return this.userTable
    } else {
      return this.userTable
    }
  }

  private defineStartTable(nameTable: string, table: Table): [ModelCtor<any> | undefined, tempSaveTable] {
    let tableSequelize = undefined
    const [tableSequelizeInfo, saveTableInfo] = this.createTableSequelizeInfo(table, nameTable, this.fileInfo)

    if (this.sequelize)
      tableSequelize = this.sequelize.define(nameTable, tableSequelizeInfo)
    return [tableSequelize, saveTableInfo]
  }

  defineTable(nameTable: string, table: Table, originRoutePath?: string): TableClass<any> | undefined {
    const [tableSequelize, saveTableInfo] = this.defineStartTable(nameTable, table)

    if (tableSequelize) {
      this.tables[nameTable] = new TableClass(nameTable, saveTableInfo.saveTable, tableSequelize, this.server, this.fileInfo.folderPath, this.serverPath, originRoutePath, this.userTable)
      saveTableInfo.table = this.tables[nameTable]
    }
    return this.tables[nameTable]
  }

  private sequelizeClassicType(tempSaveTable: tempSaveTable, tableSequelizeInfo: any, key: string, type: realDataTypeInfo, saveTableInfo: saveDataTableInfo) {
    tableSequelizeInfo[key] = {
      type: type.sequelizeType,
      primaryKey: saveTableInfo.primaryKey,
      autoIncrement: saveTableInfo.autoIncrement,
      allowNull: saveTableInfo.allowNull,
      unique: saveTableInfo.unique,
      get() {
        let value = this.getDataValue(key)
        if (value !== undefined && value !== null) {
          if (type && type.DBToJson) {
            value = type.DBToJson(value)
          }
          if (saveTableInfo && saveTableInfo.transformGet && tempSaveTable.table) {
            value = saveTableInfo.transformGet(value, tempSaveTable.table)
          }
        }
        return value
      },
      set(value: any) {
        if (value !== undefined && value !== null) {
          if (saveTableInfo.validate !== undefined) {
            applyValidator(key, value, saveTableInfo.validate)
          }
          if (saveTableInfo && saveTableInfo.transformSet && tempSaveTable.table) {
            value = saveTableInfo.transformSet(value, tempSaveTable.table)
          }
          if (type && type.JsonToDB)
            value = type.JsonToDB(value)
        }
        this.setDataValue(key, value)
      }
    }
  }

  private sequelizeFileType(tempSaveTable: tempSaveTable, tableSequelizeInfo: any, key: string, type: realDataTypeInfo, saveTableInfo: saveDataTableInfo, nameTable: string, fileInfo: filePathInfo) {
    tableSequelizeInfo[key] = {
      type: type.sequelizeType,
      primaryKey: saveTableInfo.primaryKey,
      autoIncrement: saveTableInfo.autoIncrement,
      allowNull: saveTableInfo.allowNull,
      unique: saveTableInfo.unique,
      get() {
        let value = this.getDataValue(key)
        if (value !== undefined && value !== null) {
          if (type && type.DBToJson) {
            value = type.DBToJson(value)
          }
          if (type && fileInfo.virtualPath) {
            const realPath = path.join(fileInfo.folderPath, nameTable, key, value)
            value = path.posix.join(fileInfo.virtualPath, nameTable, key, value)

            if (!fs.existsSync(realPath))
              value = undefined
          }
          if (saveTableInfo && saveTableInfo.transformGet && tempSaveTable.table) {
            value = saveTableInfo.transformGet(value, tempSaveTable.table)
          }
        }
        return value
      },
      set(value: any) {
        if (value !== undefined && value !== null) {
          if (saveTableInfo.validate !== undefined) {
            applyValidator(key, value, saveTableInfo.validate)
          }
          if (saveTableInfo && saveTableInfo.transformSet && tempSaveTable.table) {
            value = saveTableInfo.transformSet(value, tempSaveTable.table)
          }
          if (type && type.JsonToDB)
            value = type.JsonToDB(value)
          if (type && fileInfo.folderPath) {
            const oldValue = this.getDataValue(key)

            if (oldValue) {
              const pathOldValue = path.join(fileInfo.folderPath, nameTable, key, oldValue)
              removeFile(pathOldValue)
            }
          }
        }
        this.setDataValue(key, value)
      }
    }
  }

  private createTableSequelizeInfo(table: Table, nameTable: string, fileInfo: filePathInfo): [ModelAttributes<any>, tempSaveTable] {
    const tableSequelizeInfo: any = {}
    const saveTableInfo: saveTable = {}
    const tempSaveTable: tempSaveTable = {
      saveTable: {}
    }

    Object.keys(table).forEach((key) => {
      let type = this.getDataType(table[key].type)

      if (table[key].type === ABDataType.TABLE_LINK || table[key].type === ABDataType.MULTIPLE_LINK_TABLE) {
        const subType: any = table[key].type
        type = this.getTableLinkDataType((table[key] as dataLinkTable))
        const tabsInfo = (this.saveDataInfo(table[key], type) as realDataLinkTable)

        tabsInfo.subType = subType
        if (!(table[key] as dataLinkTable).onDelete) {
          tabsInfo.onDelete = DeleteAction.DELETE
        } else if ((table[key] as dataLinkTable).onDelete === DeleteAction.SET_DEFAULT && table[key].defaultValue === undefined) {
          throw TypeError('Can t set DeleteAction.SET_DEFAULT on table ' + nameTable + ' columns ' + key + ' because defaultValue === undefined')
        } else if (tabsInfo.subType !== ABDataType.MULTIPLE_LINK_TABLE && (table[key] as dataLinkTable).onDelete === DeleteAction.SET_NULL && (table[key].allowNull === undefined || table[key].allowNull === false)) {
          throw TypeError('Can t set DeleteAction.SET_NULL on table ' + nameTable + ' columns ' + key + ' because allowNull === undefined or allowNull === false')
        }

        if (!(table[key] as dataLinkTable).multipleResult) {
          tabsInfo.multipleResult = false
        }
        tabsInfo.tableToLink = this.tables[(table[key] as dataLinkTable).tableToLink.name]
        saveTableInfo[key] = tabsInfo

        if (type.autobackDataType === ABDataType.FILE) {
          this.sequelizeFileType(tempSaveTable, tableSequelizeInfo, key, type, saveTableInfo[key], nameTable, fileInfo)
        } else {
          this.sequelizeClassicType(tempSaveTable, tableSequelizeInfo, key, type, saveTableInfo[key])
        }
      } else if (type) {
        saveTableInfo[key] = this.saveDataInfo(table[key], type)

        if (type.autobackDataType === ABDataType.FILE) {
          this.sequelizeFileType(tempSaveTable, tableSequelizeInfo, key, type, saveTableInfo[key], nameTable, fileInfo)
        } else {
          this.sequelizeClassicType(tempSaveTable, tableSequelizeInfo, key, type, saveTableInfo[key])
        }
      }

    });
    tempSaveTable.saveTable = saveTableInfo
    return [tableSequelizeInfo, tempSaveTable]
  }

  private saveDataInfo(dataInfo: dataTableInfo | dataLinkTable, type: realDataTypeInfo): saveDataTableInfo {
    const temp = _.merge({}, this.defaultSaveDataInfo, dataInfo)
    temp.type = type

    if (temp.validate)
      temp.validate = _.merge({}, type.validate, temp.validate)
    else
      temp.validate = _.merge({}, type.validate)

    return temp
  }

  private getTableLinkDataType(link: dataLinkTable): realDataTypeInfo {
    if (!link.tableToLink) {
      throw Error('Wrong Table Link')
    }

    const tableToLink = this.tables[link.tableToLink.name]

    if (tableToLink) {
      const columns = link.tableToLink.table[link.columnsLink]
      let toReturn: any
      if (columns) {
        if (link.type === ABDataType.MULTIPLE_LINK_TABLE) {
          toReturn = _.clone(this.DB.dataType[ABDataType.ARRAY])
        } else {
          toReturn = _.clone(columns.type)
        }
        toReturn.isTableLink = true
        return toReturn
      } else {
        throw Error('The table' + link.tableToLink.name + ' does not have a columns with the name ' + link.columnsLink + '.')
      }
    } else {
      throw Error(link.tableToLink.name + ' is not avaible in this autoback class.')
    }
  }

  private getDataType(data: ABDataType): realDataTypeInfo | undefined {
    const type = this.DB.dataType[data]

    if (data === ABDataType.TABLE_LINK || data === ABDataType.MULTIPLE_LINK_TABLE)
      return undefined
    if (type === undefined) {
      console.error(data + " type in " + this.DB.dbName + " is not supported")
    }
    return type
  }
}
